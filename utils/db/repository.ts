import type {
  PendingQuery,
  Row,
  SerializableParameter as PgSerializableValue,
} from "postgresjs/types/index.d.ts";

import {
  columns,
  primaryKey,
  properties,
  sqlRow,
  tableName,
} from "./decorators.ts";
import sql from "./sql.ts";
import { getCache, setCache } from "../cache.ts";

import type {
  ClassExtends,
  Entity,
  EntityProps,
  FullyNullable,
  Serializable,
} from "./decorators.ts";

const selectCols = <P extends string | symbol>(
  props: { [K in P]?: boolean } | undefined,
  columns: Record<string, P>,
): string[] => {
  const included = new Set<string | symbol>();
  const excluded = new Set<string | symbol>();
  for (const [prop, status] of Object.entries(props ?? {})) {
    if (status) included.add(prop);
    else excluded.add(prop);
  }

  const cols: string[] = [];
  for (const [col, prop] of Object.entries(columns)) {
    if (included.size > 0) {
      if (included.has(prop)) cols.push(col);
    } else if (excluded.size > 0) {
      if (!excluded.has(prop)) cols.push(col);
    }
  }

  return cols;
};

type WhereBooleanOperator = (
  ...conds: PendingQuery<Row[]>[]
) => PendingQuery<Row[]>;
type WhereUnaryOperator = (cond: PendingQuery<Row[]>) => PendingQuery<Row[]>;
type WhereComparisonOperator<T> = <C extends keyof T>(
  col: C,
  value: T[C] extends PgSerializableValue<bigint> ? T[C] : never,
) => PendingQuery<Row[]>;
type WhereOperators<T> = {
  and: WhereBooleanOperator;
  or: WhereBooleanOperator;
  not: WhereUnaryOperator;
  eq: WhereComparisonOperator<T>;
  neq: WhereComparisonOperator<T>;
  lt: WhereComparisonOperator<T>;
  gt: WhereComparisonOperator<T>;
  lte: WhereComparisonOperator<T>;
  gte: WhereComparisonOperator<T>;
};

type WhereClause<T extends Entity> = (
  columns: PropsMirror<EntityProps<T>>,
  opts: WhereOperators<EntityProps<T>>,
) => PendingQuery<Row[]>;

const whereOperators = <T>(
  properties: Record<string | symbol, string>,
): WhereOperators<T> => {
  const buildBoolean =
    (operator: PendingQuery<Row[]>): WhereBooleanOperator => (...conds) => {
      if (conds.length === 0) return sql``;
      else if (conds.length === 1) return conds[0];
      else {
        const chain = conds.reduce((acc, cond) =>
          sql`${acc} ${operator} ${cond}`
        );
        return sql`( ${chain} )`;
      }
    };

  const buildComparison =
    (operator: PendingQuery<Row[]>): WhereComparisonOperator<T> =>
    (col, value) =>
      // This cast is safe as only name and symbol properties are supported.
      sql`${sql(properties[col as string | symbol])} ${operator} ${value}`;

  return {
    and: buildBoolean(sql`AND`),
    or: buildBoolean(sql`OR`),
    not: (cond) => sql`NOT ${cond}`,
    eq: buildComparison(sql`=`),
    neq: buildComparison(sql`<>`),
    lt: buildComparison(sql`<`),
    gt: buildComparison(sql`>`),
    lte: buildComparison(sql`<=`),
    gte: buildComparison(sql`>=`),
  };
};

type OrderByUnaryOperator<T> = <C extends keyof T>(
  sort: C | PendingQuery<Row[]>,
) => PendingQuery<Row[]>;
type OrderByOperators<T> = {
  asc: OrderByUnaryOperator<T>;
  desc: OrderByUnaryOperator<T>;
};

type OrderByClause<T extends Entity> = (
  columns: PropsMirror<EntityProps<T>>,
  opts: OrderByOperators<EntityProps<T>>,
) => PendingQuery<Row[]> | PendingQuery<Row[]>[];

const orderByOperators = <T>(
  properties: Record<string | symbol, string>,
): OrderByOperators<T> => {
  const buildUnary =
    (operator: PendingQuery<Row[]>): OrderByUnaryOperator<T> => (sort) =>
      sql`${
        typeof sort !== "object"
          // This cast is safe as only name and symbol properties are supported.
          ? sql(properties[sort as string | symbol])
          : sort
      } ${operator}`;

  return {
    asc: buildUnary(sql`ASC`),
    desc: buildUnary(sql`DESC`),
  };
};

const buildRows = <T extends ClassExtends<typeof Entity>>(
  table: T,
  rows: Row[],
  construct: boolean,
): Partial<T["prototype"]>[] =>
  rows.map((row) => {
    if (construct) return table.fromSql(row);
    const obj: Record<string | symbol, unknown> = {};
    Object.entries(row)
      .forEach(([col, val]) => obj[table[columns][col]] = val);
    return obj as Partial<T["prototype"]>;
  });

type PropsMirror<T> = { [K in keyof Required<T>]: K };

// WHERE and ORDER BY callback syntax inspired by Drizzle ORM
type FindOptions<T extends Entity> = {
  where?: WhereClause<T>;
  orderBy?: OrderByClause<T>;
  limit?: number;
  offset?: number;
  cache?: string | { key: string; ttl: number };
};

export const setupRepository = <
  T extends ClassExtends<typeof Entity>,
>(table: T & { prototype: Serializable<EntityProps<T["prototype"]>> }) => {
  async function insert(
    entity: Serializable<EntityProps<T["prototype"]>>,
  ): Promise<void> {
    const row = entity.toSql();

    Object.defineProperty(entity, sqlRow, { value: row, writable: true });

    await sql`INSERT INTO ${sql(table[tableName])}
    ${sql(row)}`;
  }

  // This is valid as long as every field in the entity was annotated with a
  // column decorator since the properties map contains every property on the
  // entity that isn't a part of the base entity class. I don't belive it's
  // possible to either require every field be annotated or create a type
  // representing only the fields that were annotated. With that, assuming all
  // fields seems like the most sensible approach.
  const mirror = {} as PropsMirror<EntityProps<T["prototype"]>>;
  Reflect.ownKeys(table[properties]).forEach((p) =>
    (mirror as Record<string | symbol, string | symbol>)[p] = p
  );

  async function findImpl<P extends keyof EntityProps<T["prototype"]>>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Partial<FullyNullable<T["prototype"]>>[]> {
    const cols = selectCols(props, table[columns]);
    const cacheKey = options?.cache
      ? (typeof options.cache === "string" ? options.cache : options.cache.key)
      : undefined;

    if (cacheKey) {
      const cached = getCache(`sql-${table[tableName]}`, cacheKey) as
        | Row[]
        | undefined;
      if (cached) return buildRows(table, cached, cols.length === 0);
    }

    const selectClause = cols.length === 0 ? sql`*` : sql(cols);
    const whereClause = options
      ?.where?.(mirror, whereOperators(table[properties]));
    const orderByMaybeList = options
      ?.orderBy?.(mirror, orderByOperators(table[properties]));
    const orderByClause = orderByMaybeList && Array.isArray(orderByMaybeList)
      ? orderByMaybeList.reduce?.((acc, sort) => sql`${acc}, ${sort}`)
      : orderByMaybeList;

    const query = sql`SELECT
    ${selectClause}
    FROM ${sql(table[tableName])}\
${whereClause ? sql`\n    WHERE ${whereClause}` : sql``}\
${orderByClause ? (sql`\n    ORDER BY ${orderByClause}`) : sql``}\
${options?.limit ? sql`\n    LIMIT ${options?.limit}` : sql``}\
${options?.offset ? sql`\n    OFFSET ${options?.offset}` : sql``}\
`;

    const rows = await query;
    if (cacheKey) {
      setCache(
        `sql-${table[tableName]}`,
        cacheKey,
        rows,
        typeof options?.cache === "object" ? options.cache.ttl : undefined,
      );
    }

    return buildRows(table, rows, cols.length === 0);
  }

  async function find(
    props?: Record<string, never>,
    options?: FindOptions<T["prototype"]>,
  ): Promise<FullyNullable<T["prototype"]>[]>;
  async function find<P extends keyof EntityProps<T["prototype"]>>(
    props: { [K in P]?: true },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Pick<FullyNullable<T["prototype"]>, P>[]>;
  async function find<P extends keyof EntityProps<T["prototype"]>>(
    props: { [K in P]?: false },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Omit<FullyNullable<T["prototype"]>, P>[]>;
  async function find<P extends keyof EntityProps<T["prototype"]>>(
    props: { [K in P]?: boolean },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Partial<FullyNullable<T["prototype"]>>[]>;
  async function find<P extends keyof EntityProps<T["prototype"]>>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T["prototype"]>,
  ): Promise<
    | Partial<FullyNullable<T["prototype"]>>[]
    // TypeScript doesn't understand that Omit<T, P> is assignable to
    // Partial<T> because it can't reason that Exclude<keyof T, P> is a subset
    // of keyof T.
    // This is a known bug: https://github.com/microsoft/TypeScript/issues/37768
    | Omit<FullyNullable<T["prototype"]>, P>[]
  > {
    return await findImpl(props, options);
  }

  async function findOne(
    props?: Record<string, never>,
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<FullyNullable<T["prototype"]> | undefined>;
  async function findOne<P extends keyof EntityProps<T["prototype"]>>(
    props: { [K in P]?: true },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<Pick<FullyNullable<T["prototype"]>, P> | undefined>;
  async function findOne<P extends keyof EntityProps<T["prototype"]>>(
    props: { [K in P]?: false },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<Omit<FullyNullable<T["prototype"]>, P> | undefined>;
  async function findOne<P extends keyof EntityProps<T["prototype"]>>(
    props: { [K in P]?: boolean },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<Partial<FullyNullable<T["prototype"]>> | undefined>;
  async function findOne<P extends keyof EntityProps<T["prototype"]>>(
    props?: { [K in P]?: boolean },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<
    | Partial<FullyNullable<T["prototype"]>>
    | Omit<FullyNullable<T["prototype"]>, P>
    | undefined
  > {
    return (await findImpl(props, { ...options, limit: 1 }))[0];
  }

  async function update(
    entity: Serializable<EntityProps<T["prototype"]>>,
  ): Promise<void> {
    const row = entity.toSql();

    const changes: Record<string, unknown> = {};
    for (const [col, val] of Object.entries(row)) {
      if (val !== entity[sqlRow][col]) changes[col] = val;
    }
    if (changes.length === 0) return;

    if (table[primaryKey] in changes) {
      throw new Error(
        `Illegal attempt to change primary key of row in ${table[tableName]}`,
      );
    }
    Object.defineProperty(entity, sqlRow, { value: row, writable: true });

    await sql`UPDATE ${sql(table[tableName])}
    SET ${sql(changes)}
    WHERE ${sql(table[primaryKey])} = ${row[table[primaryKey]]}`;
  }

  async function deleteImpl(
    where: T["prototype"] | WhereClause<T["prototype"]>,
    props?: undefined,
  ): Promise<number>;
  async function deleteImpl(
    where: T["prototype"] | WhereClause<T["prototype"]>,
    props: Record<string, never>,
  ): Promise<FullyNullable<T["prototype"]>[]>;
  async function deleteImpl<P extends keyof EntityProps<T["prototype"]>>(
    where: T["prototype"] | WhereClause<T["prototype"]>,
    props: { [K in P]?: true },
  ): Promise<Pick<FullyNullable<T["prototype"]>, P>[]>;
  async function deleteImpl<P extends keyof EntityProps<T["prototype"]>>(
    where: T["prototype"] | WhereClause<T["prototype"]>,
    props: { [K in P]?: false },
  ): Promise<Omit<FullyNullable<T["prototype"]>, P>[]>;
  async function deleteImpl<P extends keyof EntityProps<T["prototype"]>>(
    where: T["prototype"] | WhereClause<T["prototype"]>,
    props: { [K in P]?: boolean },
  ): Promise<Partial<FullyNullable<T["prototype"]>>[]>;
  async function deleteImpl<P extends keyof EntityProps<T["prototype"]>>(
    where: T["prototype"] | WhereClause<T["prototype"]>,
    props?: { [K in P]?: boolean },
  ): Promise<
    | number
    | Partial<FullyNullable<T["prototype"]>>[]
    | Pick<FullyNullable<T["prototype"]>, P>[]
  > {
    const cols = selectCols(props, table[columns]);

    const whereClause = typeof where !== "function"
      ? sql`${sql(table[primaryKey])} = ${where[table[primaryKey]]}`
      // Even if you explicitly Exclude<T["prototype"], Function>, TypeScript
      // is still unsure whether T["prototype"] could have a typeof "function"
      // and then throws an error because it thinks you're trying to call
      // T["prototype"] as a function. where would only ever be called if it
      // is actually a function so this cast is safe.
      // deno-lint-ignore ban-types
      : (where as Function)(mirror, whereOperators(table[properties]));
    const returningClause = cols.length === 0 ? sql`*` : sql(cols);

    const query = sql`DELETE FROM ${sql(table[tableName])}
    WHERE ${whereClause}\
${props !== undefined ? sql`\n    RETURNING ${returningClause}` : sql``}\
`;

    return props === undefined
      ? (await query).count
      : buildRows(table, await query, cols.length === 0);
  }

  return {
    insert,
    find,
    findOne,
    update,
    // "delete" is a reserved keyword
    delete: deleteImpl,
  };
};

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
  DerivedClass,
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

const buildRows = <T extends Entity & Serializable<EntityProps<T>>>(
  table: DerivedClass<typeof Entity, T>,
  rows: Row[],
  construct: boolean,
): Partial<FullyNullable<T>>[] =>
  rows.map((row) => {
    if (construct) return table.fromSql(row);
    const obj: Record<string | symbol, unknown> = {};
    Object.entries(row)
      .forEach(([col, val]) => obj[table[columns][col]] = val);
    return obj as Partial<FullyNullable<T>>;
  });

type PropsMirror<T> = { [K in keyof Required<T>]: K };

// WHERE and ORDER BY callback syntax inspired by Drizzle ORM
type FindOptions<T extends Entity> = {
  distinct?: true | (keyof EntityProps<T>)[];
  where?: WhereClause<T>;
  orderBy?: OrderByClause<T>;
  limit?: number;
  offset?: number;
  cache?: string | { key: string; ttl: number };
};

export const setupRepository = <
  T extends Entity & Serializable<EntityProps<T>>,
>(table: DerivedClass<typeof Entity, T>) => {
  async function insert(entity: T): Promise<void> {
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
  const mirror = {} as PropsMirror<EntityProps<T>>;
  Reflect.ownKeys(table[properties]).forEach((p) =>
    (mirror as Record<string | symbol, string | symbol>)[p] = p
  );

  async function findImpl<P extends keyof EntityProps<T>>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T>,
  ): Promise<Partial<FullyNullable<T>>[]> {
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
    const distinctOnList = Array.isArray(options?.distinct)
      ? options.distinct
        .map((prop) => table[properties][prop as string | symbol])
      : undefined;
    const distinctOnClause = distinctOnList &&
      sql` ON (${sql(distinctOnList)})`;
    const whereClause = options
      ?.where?.(mirror, whereOperators(table[properties]));
    const orderByDistinct = distinctOnList
      ?.map((col) => sql`${sql(col)}`)
      .reduce((acc, col) => sql`${acc}, ${col}`);
    const orderByGivenMaybeList = options
      ?.orderBy?.(mirror, orderByOperators(table[properties]));
    const orderByGiven =
      orderByGivenMaybeList && Array.isArray(orderByGivenMaybeList)
        ? orderByGivenMaybeList.reduce((acc, sort) => sql`${acc}, ${sort}`)
        : orderByGivenMaybeList;
    const orderByClause = orderByDistinct
      ? orderByGiven
        ? sql`${orderByDistinct}, ${orderByGiven}`
        : orderByDistinct
      : orderByGiven;

    const query = sql`SELECT\
${options?.distinct ? sql` DISTINCT${distinctOnClause ?? sql``}` : sql``}
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
    options?: FindOptions<T>,
  ): Promise<FullyNullable<T>[]>;
  async function find<P extends keyof EntityProps<T>>(
    props: { [K in P]?: true },
    options?: FindOptions<T>,
  ): Promise<Pick<FullyNullable<T>, P>[]>;
  async function find<P extends keyof EntityProps<T>>(
    props: { [K in P]?: false },
    options?: FindOptions<T>,
  ): Promise<Omit<FullyNullable<T>, P>[]>;
  async function find<P extends keyof EntityProps<T>>(
    props: { [K in P]?: boolean },
    options?: FindOptions<T>,
  ): Promise<Partial<FullyNullable<T>>[]>;
  async function find<P extends keyof EntityProps<T>>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T>,
  ): Promise<
    // TypeScript doesn't understand that Pick<T, P> or Omit<T, P> are
    // assignable to Partial<T> because it can't reason that P extends keyof T
    // or Exclude<keyof T, P> are subsets of keyof T.
    // This is a known bug: https://github.com/microsoft/TypeScript/issues/37768
    | Pick<FullyNullable<T>, P>[]
    | Omit<FullyNullable<T>, P>[]
    | Partial<FullyNullable<T>>[]
  > {
    return await findImpl(props, options);
  }

  async function findOne(
    props?: Record<string, never>,
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<FullyNullable<T> | undefined>;
  async function findOne<P extends keyof EntityProps<T>>(
    props: { [K in P]?: true },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<Pick<FullyNullable<T>, P> | undefined>;
  async function findOne<P extends keyof EntityProps<T>>(
    props: { [K in P]?: false },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<Omit<FullyNullable<T>, P> | undefined>;
  async function findOne<P extends keyof EntityProps<T>>(
    props: { [K in P]?: boolean },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<Partial<FullyNullable<T>> | undefined>;
  async function findOne<P extends keyof EntityProps<T>>(
    props?: { [K in P]?: boolean },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<
    | Pick<FullyNullable<T>, P>
    | Omit<FullyNullable<T>, P>
    | Partial<FullyNullable<T>>
    | undefined
  > {
    return (await findImpl(props, { ...options, limit: 1 }))[0];
  }

  async function update(entity: T): Promise<void> {
    const row = entity.toSql();

    const changes: Record<string, unknown> = {};
    for (const [col, val] of Object.entries(row)) {
      if (val !== entity[sqlRow][col]) changes[col] = val;
    }
    if (Object.keys(changes).length === 0) return;

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
    where: T | WhereClause<T>,
    props?: undefined,
  ): Promise<number>;
  async function deleteImpl(
    where: T | WhereClause<T>,
    props: Record<string, never>,
  ): Promise<FullyNullable<T>[]>;
  async function deleteImpl<P extends keyof EntityProps<T>>(
    where: T | WhereClause<T>,
    props: { [K in P]?: true },
  ): Promise<Pick<FullyNullable<T>, P>[]>;
  async function deleteImpl<P extends keyof EntityProps<T>>(
    where: T | WhereClause<T>,
    props: { [K in P]?: false },
  ): Promise<Omit<FullyNullable<T>, P>[]>;
  async function deleteImpl<P extends keyof EntityProps<T>>(
    where: T | WhereClause<T>,
    props: { [K in P]?: boolean },
  ): Promise<Partial<FullyNullable<T>>[]>;
  async function deleteImpl<P extends keyof EntityProps<T>>(
    where: T | WhereClause<T>,
    props?: { [K in P]?: boolean },
  ): Promise<
    | number
    | Pick<FullyNullable<T>, P>[]
    | Omit<FullyNullable<T>, P>[]
    | Partial<FullyNullable<T>>[]
  > {
    const cols = selectCols(props, table[columns]);

    let whereClause;
    if (typeof where === "function") {
      whereClause = where(mirror, whereOperators(table[properties]));
    } else {
      const pKey = where[table[columns][table[primaryKey]] as keyof T];
      if (pKey === undefined) throw new Error("Primary key is undefined");
      whereClause = sql`${sql(table[primaryKey])} = ${pKey}`;
    }
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

import type { PendingQuery, Row } from "postgresjs/types/index.d.ts";

import {
  columns,
  primaryKey,
  properties,
  sqlRow,
  tableName,
} from "./decorators.ts";
import sql from "./sql.ts";

import type {
  ClassExtends,
  Entity,
  EntityProps,
  FullyNullable,
} from "./decorators.ts";

const selectCols = <P extends string | symbol>(
  props: { [K in P]?: boolean } | undefined,
  columns: Record<string, P>,
) => {
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
  value: T[C],
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

type PropsMirror<T> = { [K in keyof Required<T>]: K };

// WHERE and ORDER BY callback syntax inspired by Drizzle ORM
type FindOptions<T extends Entity> = {
  where?: (
    columns: PropsMirror<EntityProps<T>>,
    opts: WhereOperators<EntityProps<T>>,
  ) => PendingQuery<Row[]>;
  orderBy?: (
    columns: PropsMirror<EntityProps<T>>,
    opts: OrderByOperators<EntityProps<T>>,
  ) => PendingQuery<Row[]> | PendingQuery<Row[]>[];
  limit?: number;
  offset?: number;
};

export const setupRepository = <
  T extends ClassExtends<typeof Entity>,
>(table: T) => {
  async function insert(entity: T["prototype"]): Promise<void> {
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

  async function findImpl<P extends keyof T["prototype"]>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Partial<FullyNullable<T["prototype"]>>[]> {
    const cols = selectCols(props, table[columns]);

    const whereClause = options
      ?.where?.(mirror, whereOperators(table[properties]));
    const orderByMaybeList = options
      ?.orderBy?.(mirror, orderByOperators(table[properties]));
    const orderByClause = orderByMaybeList && Array.isArray(orderByMaybeList)
      ? orderByMaybeList.reduce?.((acc, sort) => sql`${acc}, ${sort}`)
      : orderByMaybeList;

    const query = sql`SELECT
    ${cols.length === 0 ? sql`*` : sql(cols)}
    FROM ${sql(table[tableName])}\
${whereClause ? sql`\n    WHERE ${whereClause}` : sql``}\
${orderByClause ? (sql`\n    ORDER BY ${orderByClause}`) : sql``}\
${options?.limit ? sql`\n    LIMIT ${options?.limit}` : sql``}\
${options?.offset ? sql`\n    OFFSET ${options?.offset}` : sql``}\
`;

    return (await query).map((row) => {
      if (cols.length === 0) return table.fromSql(row);
      else {
        const obj: Record<string | symbol, unknown> = {};
        Object.entries(row)
          .forEach(([col, val]) => obj[table[columns][col]] = val);
        return obj as Partial<T["prototype"]>;
      }
    });
  }

  async function find(
    props?: Record<string, never>,
    options?: FindOptions<T["prototype"]>,
  ): Promise<FullyNullable<T["prototype"]>[]>;
  async function find<P extends keyof T["prototype"]>(
    props: { [K in P]?: true },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Pick<FullyNullable<T["prototype"]>, P>[]>;
  async function find<P extends keyof T["prototype"]>(
    props: { [K in P]?: false },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Omit<FullyNullable<T["prototype"]>, P>[]>;
  async function find<P extends keyof T["prototype"]>(
    props: { [K in P]?: boolean },
    options?: FindOptions<T["prototype"]>,
  ): Promise<Partial<FullyNullable<T["prototype"]>>[]>;
  async function find<P extends keyof T["prototype"]>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T["prototype"]>,
  ): Promise<
    | Partial<FullyNullable<T["prototype"]>>[]
    // Typescript doesn't understand that Omit<T, P> is assignable to
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
  async function findOne<P extends keyof T["prototype"]>(
    props: { [K in P]?: true },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<Pick<FullyNullable<T["prototype"]>, P> | undefined>;
  async function findOne<P extends keyof T["prototype"]>(
    props: { [K in P]?: false },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<Omit<FullyNullable<T["prototype"]>, P> | undefined>;
  async function findOne<P extends keyof T["prototype"]>(
    props: { [K in P]?: boolean },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<Partial<FullyNullable<T["prototype"]>> | undefined>;
  async function findOne<P extends keyof T["prototype"]>(
    props?: { [K in P]?: boolean },
    options?: Omit<FindOptions<T["prototype"]>, "limit">,
  ): Promise<
    | Partial<FullyNullable<T["prototype"]>>
    | Omit<FullyNullable<T["prototype"]>, P>
    | undefined
  > {
    return (await findImpl(props, { ...options, limit: 1 }))[0];
  }

  async function update(entity: T["prototype"]): Promise<void> {
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

  return {
    insert,
    find,
    findOne,
    update,
  };
};

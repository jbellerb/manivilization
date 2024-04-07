import type { PendingQuery, Row, Sql } from "postgresjs/types/index.d.ts";

import { columns, properties, tableName } from "./decorators.ts";

import type { Constructor, Entity, OmitConstructor } from "./decorators.ts";

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
  sql: Sql<Record<string, unknown>>,
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
  sql: Sql<Record<string, unknown>>,
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

// WHERE and ORDER BY callback syntax inspired by Drizzle ORM
type FindOptions<T extends typeof Entity> = {
  where?: (
    columns: { [K in keyof Required<T["prototype"]>]: K },
    opts: WhereOperators<T["prototype"]>,
  ) => PendingQuery<Row[]>;
  orderBy?: (
    columns: { [K in keyof Required<T["prototype"]>]: K },
    opts: OrderByOperators<T["prototype"]>,
  ) => PendingQuery<Row[]> | PendingQuery<Row[]>[];
  limit?: number;
  offset?: number;
};

export const setupRepository = <
  T extends OmitConstructor<typeof Entity> & { prototype: P } & Constructor,
  P,
>(sql: Sql<Record<string, unknown>>, table: T) => {
  // Key mirrors are inherently iffy and building one must be done with care.
  // Using a mirror, functions can refer to object properties in a way the type
  // system can understand. This allows creating functions generic over
  // individual keys of a type, where it is possible to use this generic key
  // type to index back into the original type. Some operators such as WHERE's
  // eq operator use this to type their argument to the actual column type.
  function buildMirror<T>(
    properties: Record<string | symbol, unknown>,
  ): { [K in keyof Required<T>]: K } {
    const mirror: Record<string | symbol, string | symbol> = {};
    Object.getOwnPropertyNames(properties).forEach((p) => mirror[p] = p);
    Object.getOwnPropertySymbols(properties).forEach((p) => mirror[p] = p);
    return mirror as { [K in keyof Required<T>]: K };
  }

  async function findImpl<P extends keyof T["prototype"]>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T>,
  ): Promise<Pick<T["prototype"], P>[] | T["prototype"][]> {
    const cols = selectCols(props, table[columns]);

    const mirror = buildMirror<T["prototype"]>(table[properties]);
    const whereClause = options
      ?.where?.(mirror, whereOperators(sql, table[properties]));
    const orderByMaybeList = options
      ?.orderBy?.(mirror, orderByOperators(sql, table[properties]));
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
      const _this = cols.length === 0 ? Object.create(table.prototype) : {};
      for (const [col, val] of Object.entries(row)) {
        _this[table[columns][col]] = val;
      }
      return _this;
    });
  }

  async function find(
    props?: Record<string, never>,
    options?: FindOptions<T>,
  ): Promise<T["prototype"][]>;
  async function find<P extends keyof T["prototype"]>(
    props: { [K in P]?: true },
    options?: FindOptions<T>,
  ): Promise<{ [K in P]: T["prototype"][K] }[]>;
  async function find<P extends keyof T["prototype"]>(
    props: { [K in P]?: false },
    options?: FindOptions<T>,
  ): Promise<{ [K in Exclude<keyof T["prototype"], P>]: T["prototype"][K] }[]>;
  async function find<P extends keyof T["prototype"]>(
    props: { [K in P]?: boolean },
    options?: FindOptions<T>,
  ): Promise<{ [K in keyof T["prototype"]]?: T["prototype"][K] }[]>;
  async function find<P extends keyof T["prototype"]>(
    props?: { [K in P]?: boolean },
    options?: FindOptions<T>,
  ): Promise<Pick<T["prototype"], P>[] | T["prototype"][]> {
    return await findImpl(props, options);
  }

  async function findOne(
    props?: Record<string, never>,
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<T["prototype"] | undefined>;
  async function findOne<P extends keyof T["prototype"]>(
    props: { [K in P]?: true },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<{ [K in P]: T["prototype"][K] } | undefined>;
  async function findOne<P extends keyof T["prototype"]>(
    props: { [K in P]?: false },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<
    { [K in Exclude<keyof T["prototype"], P>]: T["prototype"][K] } | undefined
  >;
  async function findOne<P extends keyof T["prototype"]>(
    props: { [K in P]?: boolean },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<{ [K in keyof T["prototype"]]?: T["prototype"][K] } | undefined>;
  async function findOne<P extends keyof T["prototype"]>(
    props?: { [K in P]?: boolean },
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<Pick<T["prototype"], P> | T["prototype"] | undefined> {
    return (await findImpl(props, { ...options, limit: 1 }))[0];
  }

  return {
    find,
    findOne,
  };
};

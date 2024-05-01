import type { PendingQuery, Row } from "postgresjs/types/index.d.ts";

import {
  columns,
  Entity,
  primaryKey,
  properties,
  relations,
  sqlRow,
  tableName,
} from "./entity.ts";
import sql from "./sql.ts";
import { getCache, setCache } from "../cache.ts";

import type {
  ColSelector,
  EntityJoined,
  EntityProps,
  JoinSelector,
  RelatedEntities,
  SelectCols,
  Serializable,
} from "./entity.ts";
import type { SerializableValue } from "./sql.ts";
import type { DerivedClass, FullyNullable } from "./util.ts";

const columnName = Symbol("columnName");
const columnTable = Symbol("columnTable");
const columnColumn = Symbol("columnColumn");

// deno-lint-ignore no-explicit-any
type Column<T extends Entity = Entity, C extends keyof T = any> = {
  [columnName]?: string;
  [columnTable]: DerivedClass<typeof Entity, T>;
  [columnColumn]: C;
};

type Columns<T extends Entity> = {
  -readonly [K in keyof EntityProps<T>]-?: Column<T, K>;
};
type JoinColumnSelector<T extends Entity, J extends JoinSelector<T>> = J extends
  undefined ? never : {
  [
    K in keyof J as K extends keyof T
      ? J[K] extends true | JoinSelector<Extract<T[K], Entity>> ? K : never
      : never
  ]-?: K extends keyof T ? (J[K] extends JoinSelector<Extract<T[K], Entity>> ?
        & Columns<Extract<T[K], Entity>>
        & JoinColumnSelector<Extract<T[K], Entity>, J[K]>
      : Columns<Extract<T[K], Entity>>)
    : never;
};

type WhereBooleanOperator = (
  ...conds: PendingQuery<Row[]>[]
) => PendingQuery<Row[]>;
type WhereUnaryOperator = (cond: PendingQuery<Row[]>) => PendingQuery<Row[]>;
type WhereComparisonOperator = <
  T extends Entity,
  C extends keyof T,
  T2 extends Entity,
  C2 extends keyof T2,
>(
  col: Column<T, C>,
  value:
    | Extract<T[C], SerializableValue | Entity>
    | (T2[C2] extends T[C] ? Column<T2, C2> : never),
) => PendingQuery<Row[]>;
const buildWhereBoolean =
  (operator: PendingQuery<Row[]>): WhereBooleanOperator => (...conds) => {
    if (conds.length === 0) return sql``;
    else if (conds.length === 1) return conds[0];
    else {
      const chain = conds
        .reduce((acc, cond) => sql`${acc} ${operator} ${cond}`);
      return sql`( ${chain} )`;
    }
  };
const buildWhereUnary =
  (operator: PendingQuery<Row[]>): WhereUnaryOperator => (cond) =>
    sql`${operator} ${cond}`;
const buildWhereComparison =
  (operator: PendingQuery<Row[]>): WhereComparisonOperator =>
  (
    { [columnName]: name, [columnTable]: table, [columnColumn]: col },
    value,
  ) => {
    const column = table[properties][col as string | symbol];
    const prop = sql((name ? name + "." : "") + column);
    let resolvedValue: SerializableValue;
    if (typeof value === "object" && value != null && columnColumn in value) {
      const valueColumn =
        value[columnTable][properties][value[columnColumn] as string | symbol];
      resolvedValue = sql(
        (value[columnName] ? value[columnName] + "." : "") + valueColumn,
      );
    } else if (value instanceof Entity) {
      resolvedValue =
        value.toSql()[table[relations][col as string | symbol].foreignKey];
    } else resolvedValue = value;
    return sql`${prop} ${operator} ${resolvedValue}`;
  };
const whereOperators = {
  and: buildWhereBoolean(sql`AND`),
  or: buildWhereBoolean(sql`OR`),
  not: buildWhereUnary(sql`NOT`),
  eq: buildWhereComparison(sql`=`),
  neq: buildWhereComparison(sql`<>`),
  lt: buildWhereComparison(sql`<`),
  gt: buildWhereComparison(sql`>`),
  lte: buildWhereComparison(sql`<=`),
  gte: buildWhereComparison(sql`>=`),
};

type WhereClause<T extends Entity> = (
  columns: Columns<T>,
  opts: typeof whereOperators,
) => PendingQuery<Row[]>;
type WhereClauseWithJoin<T extends Entity, J extends JoinSelector<T>> = (
  columns: Columns<T>,
  opts: typeof whereOperators,
  joins: JoinColumnSelector<T, J>,
) => PendingQuery<Row[]> | PendingQuery<Row[]>[];

type OrderByUnaryOperator = <T extends Entity, C extends keyof T>(
  sort: Column<T, C> | PendingQuery<Row[]>,
) => PendingQuery<Row[]>;
const buildOrderByUnary =
  (operator: PendingQuery<Row[]>): OrderByUnaryOperator => (sort) => {
    if (columnColumn in sort) {
      const { [columnName]: name, [columnTable]: table, [columnColumn]: col } =
        sort;
      const column = table[properties][col as string | symbol];
      return sql`${sql((name ? name + "." : "") + column)} ${operator}`;
    } else {
      return sql`${sort} ${operator}`;
    }
  };
const orderByOperators = {
  asc: buildOrderByUnary(sql`ASC`),
  desc: buildOrderByUnary(sql`DESC`),
};

type OrderByClause<T extends Entity> = (
  columns: Columns<T>,
  opts: typeof orderByOperators,
) => PendingQuery<Row[]> | PendingQuery<Row[]>[];
type OrderByClauseWithJoin<T extends Entity, J extends JoinSelector<T>> = (
  columns: Columns<T>,
  opts: typeof orderByOperators,
  joins: JoinColumnSelector<T, J>,
) => PendingQuery<Row[]> | PendingQuery<Row[]>[];

// WHERE and ORDER BY callback syntax inspired by Drizzle ORM
type FindOptions<T extends Entity> = {
  distinct?: true | keyof EntityProps<T> | (keyof EntityProps<T>)[];
  where?: WhereClause<T>;
  orderBy?: OrderByClause<T>;
  limit?: number;
  offset?: number;
  cache?: string | { key: string; ttl: number };
};
type FindOptionsWithJoin<T extends Entity, J extends JoinSelector<T>> = {
  where?: WhereClauseWithJoin<T, J>;
  orderBy?: OrderByClauseWithJoin<T, J>;
} & Omit<FindOptions<T>, "where" | "orderBy">;

type SqlColumn = {
  table?: string;
  column: string;
  joinedFrom?: string[];
};
type SqlJoin = {
  table: string;
  as?: string;
  on?: PendingQuery<Row[]>;
  children?: Record<string, SqlJoin>;
};

const selectCols = <T extends Entity, J extends JoinSelector<T> | void>(
  props: ColSelector<EntityJoined<T, J>> | undefined,
  table: DerivedClass<typeof Entity, T>,
  joins?: J,
  name?: string,
  tables: Record<string, number> = {},
): { cols: SqlColumn[]; joins?: Record<string, SqlJoin> } => {
  const queryCols: SqlColumn[] = [];
  const queryJoins: Record<string, SqlJoin> = {};
  const tableJoins = new Map<string, boolean | JoinSelector<T>>();
  const tableProps = Object.fromEntries(
    Reflect.ownKeys(table[properties])
      .map((p) => [table[properties][p], props?.[p as keyof typeof props]]),
  );

  const isExclusive = Object.values(tableProps).some((s) => s);
  for (const [col, status] of Object.entries(tableProps)) {
    if (isExclusive ? status : status !== false) {
      queryCols.push({ column: col });
      if (table[relations][table[columns][col]]) {
        const join = joins?.[table[columns][col] as keyof typeof joins];
        join && tableJoins.set(col, join);
      }
    }
  }

  if (tableJoins.size > 0) queryCols.forEach((c) => c.table = table[tableName]);
  for (const [col, status] of tableJoins) {
    const rel = table[relations][table[columns][col]];
    tables[rel.table[tableName]] = (tables[rel.table[tableName]] ?? -1) + 1;
    const as = tables[rel.table[tableName]] > 0
      ? `${rel.table[tableName]}_${tables[rel.table[tableName]]}`
      : undefined;
    const on = sql`${sql(`${name ?? table[tableName]}.${col}`)} = ${
      sql(`${as ?? rel.table[tableName]}.${rel.foreignKey}`)
    }`;
    const joined = selectCols(
      typeof tableProps[col] === "object" ? tableProps[col] : {},
      rel.table,
      // @ts-ignore TypeScript doesn't know that status is the JoinSelector
      // for rel.table. Not going to bother fixing this, the generics are
      // complicated enough as is...
      typeof status === "object" ? status : undefined,
      as,
      tables,
    );
    queryCols.push(...joined.cols.map((c) => ({
      ...c,
      table: c.table ?? as ?? rel.table[tableName],
      joinedFrom: [col, ...(c.joinedFrom ?? [])],
    })));
    queryJoins[col] = {
      table: rel.table[tableName],
      as,
      on,
      children: joined.joins,
    };
  }

  return {
    cols: queryCols,
    joins: Object.keys(queryJoins).length > 0 ? queryJoins : undefined,
  };
};

const buildColSelector = <T extends Entity>(
  table: DerivedClass<typeof Entity, T>,
  as?: string,
): Columns<T> => {
  const colSelector: Record<string | symbol, Column> = {};
  Reflect.ownKeys(table[properties]).forEach((prop) =>
    colSelector[prop] = {
      [columnName]: as,
      [columnTable]: table,
      [columnColumn]: table[properties][prop],
    }
  );
  return colSelector as Columns<T>;
};

const buildJoinSelector = <T extends Entity, J extends JoinSelector<T>>(
  table: DerivedClass<typeof Entity, T>,
  joins?: Record<string, SqlJoin>,
): JoinColumnSelector<T, J> => {
  const joinSelector: Record<string | symbol, Record<string | symbol, Column>> =
    {};
  Object.entries(joins ?? {}).forEach(([prop, join]) => {
    const rel = table[relations][prop];
    const cols = buildColSelector(rel.table, join.as ?? join.table);
    if (cols) joinSelector[table[columns][prop]] = cols;
    if (join.children) {
      const children = buildJoinSelector(rel.table, join.children);
      Reflect.ownKeys(children).forEach((child) =>
        Object.assign(
          joinSelector[table[columns][prop]][child],
          children[child as keyof typeof children],
        )
      );
    }
  });
  return joinSelector as JoinColumnSelector<T, J>;
};

const buildJoinList = (
  joins?: Record<string, SqlJoin>,
): SqlJoin[] | undefined => {
  if (!joins) return undefined;
  const list = Object.values(joins).flatMap(({ table, as, on, children }) => {
    return [{ table, as, on }, ...(children && buildJoinList(children)) ?? []];
  });
  return list.length > 0 ? list : undefined;
};

const buildRow = <T extends Entity, J extends JoinSelector<T> | void>(
  props: ColSelector<EntityJoined<T, J>> | undefined,
  table: DerivedClass<typeof Entity, T>,
  row: Row,
  cols: SqlColumn[],
): Partial<FullyNullable<EntityJoined<T, J>>> => {
  const obj: Record<string, SerializableValue> = {};
  const joins: Record<string, unknown> = {};
  let idx = 0;
  while (idx < row.length) {
    const col = cols[idx];
    if (col.joinedFrom && col.joinedFrom.length > 0) {
      const key = col.joinedFrom[0];
      let skip = cols.slice(idx).findIndex((c) => c.joinedFrom?.[0] !== key);
      skip = skip === -1 ? cols.length - idx : skip;
      joins[key] = buildRow(
        props?.[table[columns][key] as keyof typeof props],
        table[relations][table[columns][key]].table,
        row.slice(idx).toSpliced(skip),
        cols.slice(idx).toSpliced(skip)
          .map((c) => ({ ...c, joinedFrom: c.joinedFrom?.slice(1) })),
      );
      idx += skip;
    } else {
      obj[col.column] = row[idx];
      idx += 1;
    }
  }

  let entity: Record<string | symbol, unknown> = {};
  if (Object.keys(obj).length === Object.keys(table[columns]).length) {
    entity = table.fromSql(obj);
  } else {
    for (const [col, val] of Object.entries(obj)) {
      entity[table[columns][col]] = val;
    }
  }
  for (const [col, val] of Object.entries(joins)) {
    entity[table[columns][col]] = val;
  }
  return entity as FullyNullable<EntityJoined<T, J>>;
};

export const setupRepository = <
  T extends Entity,
>(table: DerivedClass<typeof Entity, T>) => {
  async function insert(entity: T): Promise<void> {
    const row = entity.toSql();

    Object.defineProperty(entity, sqlRow, { value: row, writable: true });

    await sql`INSERT INTO ${sql(table[tableName])}
    ${sql(row)}`;
  }

  async function findImpl<
    J extends JoinSelector<T>,
    P extends ColSelector<EntityJoined<T, J>>,
  >(
    props?: P,
    options?: FindOptions<T> | FindOptionsWithJoin<T, J>,
    join?: J,
  ): Promise<Partial<FullyNullable<EntityJoined<T, J>>>[]> {
    const { cols, joins } = selectCols(props, table, join);
    const cacheKey = options?.cache
      ? (typeof options.cache === "string" ? options.cache : options.cache.key)
      : undefined;

    if (cacheKey) {
      const cached = getCache(`sql-${table[tableName]}`, cacheKey) as
        | Row[]
        | undefined;
      if (cached) return cached.map((row) => buildRow(props, table, row, cols));
    }

    const colSelector = buildColSelector(
      table,
      joins ? table[tableName] : undefined,
    );
    const joinSelector = buildJoinSelector<T, J>(table, joins);

    const selectClause = sql(cols
      .map(({ table, column }) => (table ? table + "." : "") + column));
    const distinctOnList = options?.distinct && Array.isArray(options.distinct)
      ? options.distinct
        .map((prop) => table[properties][prop as string | symbol])
      : options?.distinct && options.distinct !== true
      ? [table[properties][options.distinct as string | symbol]]
      : undefined;
    const distinctOnClause = distinctOnList &&
      sql` ON (${sql(distinctOnList)})`;
    const joinList = buildJoinList(joins)?.map(({ as, on, table }) =>
      sql`${sql(table)}${as ? sql` AS ${sql(as)}` : sql``}\
${on ? sql` ON ${on}` : sql``}`
    );
    const joinClause = joinList
      ?.reduce((acc, smt) => sql`${acc}\n    LEFT OUTER JOIN ${smt}`);
    const whereClause = options
      ?.where?.(colSelector, whereOperators, joinSelector);
    const orderByDistinct = distinctOnList
      ?.map((col) => sql`${sql(col)}`)
      .reduce((acc, col) => sql`${acc}, ${col}`);
    const orderByGivenMaybeList = options
      ?.orderBy?.(colSelector, orderByOperators, joinSelector);
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
${joinClause ? sql`\n    LEFT OUTER JOIN ${joinClause}` : sql``}\
${whereClause ? sql`\n    WHERE ${whereClause}` : sql``}\
${orderByClause ? (sql`\n    ORDER BY ${orderByClause}`) : sql``}\
${options?.limit ? sql`\n    LIMIT ${options?.limit}` : sql``}\
${options?.offset ? sql`\n    OFFSET ${options?.offset}` : sql``}\
`;

    const rows = await query.values();
    if (cacheKey) {
      setCache(
        `sql-${table[tableName]}`,
        cacheKey,
        rows,
        typeof options?.cache === "object" ? options.cache.ttl : undefined,
      );
    }

    return rows.map((row) => buildRow(props, table, row, cols));
  }

  async function find(
    props?: Record<string, never>,
    options?: FindOptions<T>,
  ): Promise<FullyNullable<EntityJoined<T, void>>[]>;
  async function find<P extends ColSelector<EntityJoined<T, void>>>(
    props: P,
    options?: FindOptions<T>,
  ): Promise<SelectCols<FullyNullable<EntityJoined<T, void>>, P>[]>;
  async function find<J extends JoinSelector<T>>(
    props: Record<string, never> | undefined,
    options: FindOptionsWithJoin<T, NoInfer<J>>,
    join: J,
  ): Promise<FullyNullable<EntityJoined<T, J>>[]>;
  async function find<
    J extends JoinSelector<T>,
    P extends ColSelector<EntityJoined<T, NoInfer<J>>>,
  >(
    props: P,
    options: FindOptionsWithJoin<T, NoInfer<J>>,
    join: J,
  ): Promise<SelectCols<FullyNullable<EntityJoined<T, J>>, P>[]>;
  async function find<
    J extends JoinSelector<T>,
    P extends ColSelector<EntityJoined<T, NoInfer<J>>>,
  >(
    props?: P,
    options?: FindOptions<T> | FindOptionsWithJoin<T, NoInfer<J>>,
    join?: J,
  ): Promise<
    | Partial<FullyNullable<EntityJoined<T, void>>>[]
    | Partial<FullyNullable<EntityJoined<T, J>>>[]
  > {
    return await findImpl(props, options, join);
  }

  async function findOne(
    props?: Record<string, never>,
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<FullyNullable<EntityJoined<T, void>> | undefined>;
  async function findOne<P extends ColSelector<EntityJoined<T, void>>>(
    props: P,
    options?: Omit<FindOptions<T>, "limit">,
  ): Promise<SelectCols<FullyNullable<EntityJoined<T, void>>, P> | undefined>;
  async function findOne<J extends JoinSelector<T>>(
    props: Record<string, never> | undefined,
    options: Omit<FindOptionsWithJoin<T, NoInfer<J>>, "limit">,
    join: J,
  ): Promise<FullyNullable<EntityJoined<T, J>> | undefined>;
  async function findOne<
    J extends JoinSelector<T>,
    P extends ColSelector<EntityJoined<T, NoInfer<J>>>,
  >(
    props: P,
    options: Omit<FindOptionsWithJoin<T, NoInfer<J>>, "limit">,
    join: J,
  ): Promise<SelectCols<FullyNullable<EntityJoined<T, J>>, P> | undefined>;
  async function findOne<
    J extends keyof RelatedEntities<T>,
    P extends ColSelector<EntityJoined<T, NoInfer<J>>>,
  >(
    props?: P,
    options?: Omit<FindOptionsWithJoin<T, NoInfer<J>>, "limit">,
    join?: J,
  ): Promise<
    | Partial<FullyNullable<EntityJoined<T, void>>>
    | Partial<FullyNullable<EntityJoined<T, J>>>
    | undefined
  > {
    return (await findImpl(props, { ...options, limit: 1 }, join))[0];
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

    await sql`UPDATE ${sql(table[tableName])}
    SET ${sql(changes)}
    WHERE ${sql(table[primaryKey])} = ${row[table[primaryKey]]}`;

    Object.defineProperty(entity, sqlRow, { value: row, writable: true });
  }

  async function deleteImpl(
    where: Serializable<EntityProps<T>> | WhereClause<T>,
    props?: undefined,
  ): Promise<number>;
  async function deleteImpl(
    where: Serializable<EntityProps<T>> | WhereClause<T>,
    props: Record<string, never>,
  ): Promise<FullyNullable<EntityJoined<T, void>>[]>;
  async function deleteImpl<P extends ColSelector<EntityJoined<T, void>>>(
    where: Serializable<EntityProps<T>> | WhereClause<T>,
    props: P,
  ): Promise<SelectCols<FullyNullable<EntityJoined<T, void>>, P>[]>;
  async function deleteImpl<P extends ColSelector<EntityJoined<T, void>>>(
    where: Serializable<EntityProps<T>> | WhereClause<T>,
    props?: P,
  ): Promise<
    | number
    | Partial<FullyNullable<EntityJoined<T, void>>>[]
  > {
    const { cols } = selectCols(props, table);

    let whereClause;
    if (typeof where === "function") {
      whereClause = where(buildColSelector(table), whereOperators);
    } else {
      const pKey =
        where[table[columns][table[primaryKey]] as keyof EntityProps<T>];
      if (pKey == null) throw new Error("Primary key is undefined or null");
      if (pKey !== undefined) {
        if (pKey !== null && pKey instanceof Entity) {
          throw new Error("Primary key is referencing a foreign table");
        }
      }
      whereClause = sql`${sql(table[primaryKey])} = ${pKey}`;
    }
    const returningClause = sql(cols
      .map(({ table, column }) => (table ? table + "." : "") + column));

    const query = sql`DELETE FROM ${sql(table[tableName])}
    WHERE ${whereClause}\
${returningClause ? sql`\n    RETURNING ${returningClause}` : sql``}\
`;

    return props === undefined
      ? (await query).count
      : (await query.values()).map((row) => buildRow(props, table, row, cols));
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

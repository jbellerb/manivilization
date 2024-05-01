import type { SerializableValue } from "./sql.ts";
import type { DerivedClass, FullyNullable } from "./util.ts";

export type Relation = {
  table: DerivedClass<typeof Entity, Entity>;
  foreignKey: string;
};

export const tableName = Symbol("tableName");
export const primaryKey = Symbol("primaryKey");
export const columns = Symbol("columns");
export const properties = Symbol("properties");
export const relations = Symbol("relations");
export const sqlRow = Symbol("sqlRow");

export class Entity {
  static [tableName]: string = "";
  static [primaryKey]: string = "";
  static [columns]: Record<string, string | symbol> = {};
  static [properties]: Record<string | symbol, string> = {};
  static [relations]: Record<string | symbol, Relation> = {};

  [sqlRow]: Record<string, SerializableValue> = {};

  static fromSql<T extends Entity>(
    this: DerivedClass<typeof Entity, T>,
    row: Record<string, SerializableValue>,
  ): FullyNullable<EntityJoined<T, void>> {
    const _this = Object.create(this.prototype);
    Object.defineProperty(_this, sqlRow, { value: row, writable: true });
    for (const [col, val] of Object.entries(row)) {
      _this[this[columns][col]] = val;
    }
    return _this;
  }

  toSql<T extends Entity>(
    this: Serializable<EntityProps<T>>,
  ): Record<string, SerializableValue> {
    const row: Record<string, SerializableValue> = {};
    const table = this.constructor as typeof Entity;
    Reflect.ownKeys(table[properties]).forEach((p) => {
      const val = this[p as keyof EntityProps<T>];
      if (val !== undefined) {
        if (val !== null && val instanceof Entity) {
          row[table[properties][p]] =
            val.toSql()[table[relations][p].foreignKey];
        } else {
          row[table[properties][p]] = val;
        }
      }
    });
    return row;
  }
}

export type EntityProps<T> = Omit<T, keyof Entity>;

export type Serializable<T> = {
  [K in keyof T]: T[K] extends SerializableValue | Entity | undefined ? T[K]
    : never;
};

export type RelatedEntities<T> = {
  [
    K in keyof EntityProps<T> as Extract<T[K], Entity> extends never ? never : K
  ]-?: Extract<T[K], Entity>;
};

export type JoinSelector<T> = keyof RelatedEntities<T> extends never
  ? Record<string, never>
  : {
    [K in keyof RelatedEntities<T>]?:
      | boolean
      | JoinSelector<RelatedEntities<T>[K]>;
  };
export type EntityJoined<T, F extends JoinSelector<T> | void> = {
  [K in keyof T]: K extends keyof RelatedEntities<T>
    ? F extends JoinSelector<T>
      ? F[K] extends JoinSelector<Extract<T[K], Entity>>
        ? EntityJoined<Extract<T[K], Entity>, F[K]>
      : F[K] extends true | Record<string, never>
        ? EntityJoined<Extract<T[K], Entity>, void>
      : F[K] extends false ? Exclude<T[K], Entity>
      : Exclude<T[K], Entity> | EntityJoined<Extract<T[K], Entity>, void>
    : Exclude<T[K], Entity>
    : T[K];
};

// typescript is my passion~~
export type ColSelector<T> = {
  [K in keyof EntityProps<T>]?: (Extract<T[K], Entity> extends never ? boolean
    : boolean | ColSelector<Extract<EntityProps<T>[K], Entity>>);
};
type AllFalse<T, P extends ColSelector<T>> = {
  [K in keyof EntityProps<T>]: K extends keyof P
    ? P[K] extends false | undefined ? true : false
    : never;
}[keyof EntityProps<T>];
type IsBoolean<T> = boolean extends T ? undefined extends T ? false : true
  : false;
type BooleanCols<T, P extends ColSelector<T>> = {
  [K in keyof EntityProps<T> as IsBoolean<P[K]> extends true ? K : never]+?:
    T[K];
};
type EnabledCols<T, P extends ColSelector<T>> = {
  [K in keyof EntityProps<T> as P[K] extends true | object ? K : never]-?:
    Extract<T[K], Entity> extends never ? T[K]
      : P[K] extends Record<string, never> ? T[K]
      : P[K] extends object ? SelectCols<T[K], P[K]>
      : T[K];
};
type UnknownCols<T, P extends ColSelector<T>> = {
  [K in keyof EntityProps<T> as undefined extends P[K] ? K : never]+?: T[K];
};
export type SelectCols<T, P extends ColSelector<T>> = (
  AllFalse<T, P> extends true
    ? { [K in keyof EntityProps<T> as P[K] extends false ? never : K]-?: T[K] }
    :
      & BooleanCols<T, P>
      & (keyof EnabledCols<T, P> extends never ? UnknownCols<T, P>
        : EnabledCols<T, P>)
) extends infer O ? { [K in keyof O]: O[K] } : never;

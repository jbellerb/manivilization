// deno-lint-ignore no-explicit-any
type Constructor<R = unknown, A extends unknown[] = any[]> = {
  new (...args: A): NonNullable<R>;
};
type OmitConstructor<T extends Constructor> = Omit<
  T,
  ({ [K in keyof T]: T[K] extends Constructor ? K : never })[keyof T]
>;

export type FullyNullable<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K];
};

export type ClassExtends<T extends Constructor> =
  & OmitConstructor<T>
  & Constructor;

export type SerializableValue =
  | null
  | boolean
  | number
  | bigint
  | string
  | Date
  | Uint8Array
  | Array<SerializableValue>
  | SerializableObject;
interface SerializableObject {
  [x: string]: SerializableValue;
}
export type Serializable<T> = {
  [K in keyof T]: T[K] extends SerializableValue | undefined ? T[K] : never;
};

export const tableName = Symbol("tableName");
export const primaryKey = Symbol("primaryKey");
export const columns = Symbol("columns");
export const properties = Symbol("properties");
export const sqlRow = Symbol("sqlRow");

export class Entity {
  static [tableName]: string = "";
  static [primaryKey]: string = "";
  static [columns]: Record<string, string | symbol> = {};
  static [properties]: Record<string | symbol, string> = {};

  [sqlRow]: Record<string, unknown> = {};

  static fromSql<
    T extends ClassExtends<typeof Entity>,
  >(this: T, row: Record<string, unknown>): FullyNullable<InstanceType<T>> {
    const _this = Object.create(this.prototype);
    Object.defineProperty(_this, sqlRow, { value: row, writable: true });
    for (const [col, val] of Object.entries(row)) {
      _this[this[columns][col]] = val;
    }
    return _this;
  }

  toSql<T extends Entity>(this: T): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    const props = (this.constructor as typeof Entity)[properties];
    Reflect.ownKeys(props).forEach((p) => {
      const val = this[p as keyof T];
      if (val !== undefined) row[props[p]] = val;
    });
    return row;
  }
}

export type EntityProps<T extends Entity> = Omit<T, keyof Entity>;

// I think it's fine to rely on a global object for collecting class fields?
// This seems like a supported use case of decorators and I can't think of any
// other possible way to do it besides maybe binding each entity to its own
// collector thing but that's annoying to work with. Regardless, the
// initializer order is stable and everything is executed sequentially so there
// shouldn't be any way for different entities to mix properties.
const knownCols = new Map<string, string | symbol>();
const knownPrimary: { first?: string; chosen?: string } = {};

export const column = (name: string, primary?: boolean) =>
(
  _value: undefined,
  context: ClassFieldDecoratorContext,
) => {
  knownCols.set(name, context.name);
  knownPrimary.first ??= name;
  if (primary) {
    if (!knownPrimary.chosen) knownPrimary.chosen = name;
    else throw new Error("Only one primary key is allowed per entity");
  }
};

export const table = (name: string) =>
<T extends ClassExtends<typeof Entity>>(
  _target: T & { prototype: Serializable<EntityProps<T["prototype"]>> },
  context: ClassDecoratorContext<T>,
) => {
  const discovered = Array.from(knownCols);
  knownCols.clear();

  const primary = knownPrimary.chosen ?? knownPrimary.first;
  if (!primary) throw new Error("Entity has no columns");
  [knownPrimary.first, knownPrimary.chosen] = [undefined, undefined];

  const cols = Object.fromEntries(discovered);
  const props = Object.fromEntries(discovered.map(([k, v]) => [v, k]));

  context.addInitializer(function () {
    Object.defineProperty(this, tableName, { value: name });
    Object.defineProperty(this, primaryKey, { value: primary });
    Object.defineProperty(this, columns, { value: cols });
    Object.defineProperty(this, properties, { value: props });
  });
};

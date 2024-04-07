// deno-lint-ignore no-explicit-any
export type Constructor<A extends unknown[] = any[], R = unknown> = {
  new (...args: A): NonNullable<R>;
};

export type OmitConstructor<T extends Constructor> = Omit<
  T,
  ({ [K in keyof T]: T[K] extends Constructor ? K : never })[keyof T]
>;

export const tableName = Symbol("tableName");
export const columns = Symbol("columns");
export const properties = Symbol("properties");

export class Entity {
  static [tableName]: string = "";
  static [columns]: Record<string, string | symbol> = {};
  static [properties]: Record<string | symbol, string> = {};
}

// I think it's fine to rely on a global object for collecting class fields?
// This seems like a supported use case of decorators and I can't think of any
// other possible way to do it besides maybe binding each entity to its own
// collector thing but that's annoying to work with. Regardless, the
// initializer order is stable and everything is executed sequentially so there
// shouldn't be any way for different entities to mix properties.
const knownCols = new Map<string, string | symbol>();

export const column = (name: string) =>
(
  _value: undefined,
  context: ClassFieldDecoratorContext,
) => {
  knownCols.set(name, context.name);
};

export const table =
  (name: string) =>
  <T extends OmitConstructor<typeof Entity> & Constructor>(
    _target: T,
    context: ClassDecoratorContext<T>,
  ) => {
    const discovered = Array.from(knownCols);
    knownCols.clear();

    const cols = Object.fromEntries(discovered);
    const props = Object.fromEntries(discovered.map(([k, v]) => [v, k]));

    context.addInitializer(function () {
      Object.defineProperty(this, tableName, { value: name });
      Object.defineProperty(this, columns, { value: cols });
      Object.defineProperty(this, properties, { value: props });
    });
  };

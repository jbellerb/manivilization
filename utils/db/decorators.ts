import {
  columns,
  primaryKey,
  properties,
  relations,
  tableName,
} from "./entity.ts";

import type { Entity, EntityProps, Relation } from "./entity.ts";
import type { SerializableValue } from "./sql.ts";
import type { Constructor, DerivedClass, PropsExtending } from "./util.ts";

// I think it's fine to rely on a global object for collecting class fields?
// This seems like a supported use case of decorators and I can't think of any
// other possible way to do it besides maybe binding each entity to its own
// collector thing but that's annoying to work with. Regardless, the
// initializer order is stable and everything is executed sequentially so there
// shouldn't be any way for different entities to mix properties.
const knownCols = new Map<string, string | symbol>();
const knownRelations = new Map<string | symbol, Relation>();
const knownPrimary: { first?: string; chosen?: string } = {};

export const column = <
  T extends Entity,
  P extends boolean | undefined,
  V extends (P extends true ? never : Entity) | SerializableValue | undefined,
>(name: string, primary?: P) =>
(_value: undefined, context: ClassFieldDecoratorContext<T, V>) => {
  knownCols.set(name, context.name);
  knownPrimary.first ??= name;
  if (primary) {
    if (!knownPrimary.chosen) knownPrimary.chosen = name;
    else throw new Error("Only one primary key is allowed per entity");
  }
};

export type PropsMirror<T> = { [K in keyof T]-?: K };
export function buildMirror<T extends object>(obj: T): PropsMirror<T> {
  const mirror = {} as PropsMirror<T>;
  Reflect.ownKeys(obj).forEach((p) =>
    (mirror as Record<string | symbol, string | symbol>)[p] = p
  );
  return mirror;
}

export const references = <
  T extends Entity,
  V extends SerializableValue | Entity | undefined,
  F extends V & Entity,
>(
  table: DerivedClass<typeof Entity, F>,
  column: (
    columns: PropsMirror<Pick<F, PropsExtending<EntityProps<F>, V>>>,
  ) => PropsExtending<EntityProps<F>, V>,
) =>
(_value: undefined, context: ClassFieldDecoratorContext<T, V>) => {
  if (knownRelations.has(context.name)) {
    throw new Error("Columns cannot have multiple relations");
  }
  // This is valid as long as every field in the entity was annotated with a
  // column decorator since the properties map contains every property on the
  // entity that isn't a part of the base entity class. I don't belive it's
  // possible to either require every field be annotated or create a type
  // representing only the fields that were annotated. With that, assuming all
  // fields seems like the most sensible approach.
  const columnName = column(buildMirror(table[properties] as EntityProps<F>));
  knownRelations.set(context.name, {
    table: table,
    foreignKey: table[properties][columnName as string | symbol],
  });
};

export const table = (name: string) =>
<T extends Entity>(
  _target: Constructor<T>,
  context: ClassDecoratorContext<Constructor<T>>,
) => {
  const discovered = Array.from(knownCols);
  knownCols.clear();

  const primary = knownPrimary.chosen ?? knownPrimary.first;
  if (!primary) throw new Error("Entity has no columns");
  [knownPrimary.first, knownPrimary.chosen] = [undefined, undefined];

  const cols = Object.fromEntries(discovered);
  const props = Object.fromEntries(discovered.map(([k, v]) => [v, k]));

  const rels = Object.fromEntries(knownRelations);
  knownRelations.clear();
  if (props[primary] in rels) {
    throw new Error("Primary key cannot have a relation");
  }

  context.addInitializer(function () {
    Object.defineProperty(this, tableName, { value: name });
    Object.defineProperty(this, primaryKey, { value: primary });
    Object.defineProperty(this, columns, { value: cols });
    Object.defineProperty(this, properties, { value: props });
    Object.defineProperty(this, relations, { value: rels });
  });
};

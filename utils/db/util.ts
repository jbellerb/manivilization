// deno-lint-ignore no-explicit-any
export type Constructor<R = unknown, A extends unknown[] = any[]> = {
  new (...args: A): NonNullable<R>;
};

export type OmitConstructor<T extends Constructor> = Omit<
  T,
  { [K in keyof T]-?: T[K] extends Constructor ? K : never }[keyof T]
>;

export type DerivedClass<T extends Constructor, R extends InstanceType<T>> =
  & OmitConstructor<T>
  & Constructor<R>;

export type FullyNullable<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K];
};

export type PropsExtending<T, V> = {
  [K in keyof T]-?: V extends T[K] ? K : never;
}[keyof T];

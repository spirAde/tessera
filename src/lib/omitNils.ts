import { SetRequired } from 'type-fest';

type OmitNils<T> = SetRequired<
  Partial<{
    [K in keyof T]: T[K] extends null | infer V ? V : T[K];
  }>,
  NonNilKeys<T>
>;

type NonNilKeys<T> = NonNullable<
  {
    [Key in keyof T]: undefined extends T[Key] ? never : null extends T[Key] ? never : Key;
  }[keyof T]
>;

export function omitNils<T extends Record<string, any>>(value: T): OmitNils<T> {
  const result: T = { ...value };

  for (const key of Object.keys(value)) {
    if (value[key] === null || value[key] === undefined) {
      delete result[key];
    }
  }

  return result as unknown as OmitNils<T>;
}

type RequiredProperties<T, K extends keyof T> = T & Required<Pick<T, K>>;
type EagerLoaded<T, K extends keyof T> = RequiredProperties<T, K>;

type DeepRequired<T, P extends string[]> = T extends object
  ? Omit<T, Extract<keyof T, P[0]>> &
      Required<{
        [K in Extract<keyof T, P[0]>]: NonNullable<DeepRequired<T[K], ShiftUnion<P>>>;
      }>
  : T;

type ShiftUnion<T> = T extends any[] ? Shift<T> : never;
type Shift<T extends any[]> = ((...t: T) => any) extends (first: any, ...rest: infer Rest) => any
  ? Rest
  : never;

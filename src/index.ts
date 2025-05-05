/**
 * Creates a strongly-typed error result object.
 *
 * @template E - The error type, must extend Error
 * @template T - The error tag type, must be a string
 * @param payload - The error payload object
 * @param payload.error - The error instance
 * @param payload.tag - A string tag to identify the error type
 * @returns A typed error result object with status "error"
 *
 * @example
 * // Basic usage
 * const err = error({
 *   error: new Error("Not found"),
 *   tag: "NOT_FOUND"
 * });
 * err
 * // ^? const err: { status: "error"; error: Error; tag: "NOT_FOUND"; }
 */
export const error = <E extends Error, T extends string>(payload: {
  error: E;
  tag: T;
}) => {
  return {
    status: "error",
    error: payload.error,
    tag: payload.tag,
  } as const;
};

/**
 * Creates a strongly-typed success result object.
 *
 * @template D - The data type
 * @param payload - The success payload object
 * @param payload.data - The success data
 * @returns A typed success result object with status "success"
 *
 * @example
 * // Basic usage with string data
 * const result = ok({ data: "Operation successful" });
 *
 * @example
 * // With complex data type
 * interface User { id: number; name: string; }
 * const result = ok({ data: { id: 1, name: "John" } as User });
 * result
 * // ^? const result: { status: "success"; data: User; }
 */
export const ok = <D>(payload: { data: D }) => {
  return {
    status: "success",
    data: payload.data,
  } as const;
};

/**
 * Type representing a successful result with generic data type R.
 * Has a "success" status and contains the success data.
 *
 * @template R - The type of the success data
 *
 * @example
 * type UserResult = Success<User>;
 * // Equivalent to: { status: "success", data: User }
 */
export type Success<R> = ReturnType<typeof ok<R>>;

/**
 * Type representing an error result with generic error type E and tag type T.
 * Has an "error" status and contains both the error instance and a tag.
 *
 * @template E - The error type (must extend Error)
 * @template T - The error tag type (must be string)
 *
 * @example
 * type ValidationErrorResult = Err<Error, "VALIDATION">;
 * // Equivalent to: { status: "error", error: Error, tag: "VALIDATION" }
 */
export type Err<E extends Error, T extends string> = ReturnType<
  typeof error<E, T>
>;

/**
 * Type for error handler functions that convert unknown errors to typed error results.
 *
 * @template T - The error tag type
 *
 * @example
 * const handleApiError: OnError<"API_ERROR"> = (err) => error({
 *   error: new Error("API request failed"),
 *   tag: "API_ERROR"
 * });
 */
export type OnError<T extends string> = (
  err: unknown
) => ReturnType<typeof error<Error, T>>;

/**
 * Wraps a synchronous function in a try-catch block and returns a typed Result object.
 * Provides two overloads:
 * 1. With an error handler function
 * 2. With an error tag string
 *
 * @template R - The return type of the wrapped function
 * @template T - The error tag type
 * @param fn - The function to wrap
 * @param tagOrOnError - Either an error tag string or an error handler function
 * @returns A Result object (either Success<R> or Err<Error, T>)
 *
 * @example
 * // Using with an error handler function
 * const result = tryCatch(
 *   () => JSON.parse('{"invalid": json}'),
 *   (err) => error({
 *     error: new Error("Parse failed"),
 *     tag: "PARSE_ERROR"
 *   })
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "PARSE_ERROR"; } | { status: "success"; data: any; }
 *
 * @example
 * // Using with an error tag string
 * const result = tryCatch(
 *   () => localStorage.getItem("user"),
 *   "STORAGE_ERROR"
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "STORAGE_ERROR"; } | { status: "success"; data: string; }
 */
export function tryCatch<R, T extends string>(
  fn: () => R,
  onError: OnError<T>
): Success<R> | ReturnType<OnError<T>>;
export function tryCatch<R, T extends string>(
  fn: () => R,
  tag: T
): Success<R> | Err<Error, T>;
export function tryCatch<R, T extends string>(
  fn: () => R,
  tagOrOnError?: T | OnError<T>,
  onError?: OnError<T>
): Success<R> | Err<Error, T> | ReturnType<OnError<T>> {
  try {
    return ok({ data: fn() });
  } catch (err) {
    if (typeof tagOrOnError === "function") return tagOrOnError(err);
    if (!tagOrOnError) throw new Error("Tag is required");
    if (err instanceof Error) return error({ error: err, tag: tagOrOnError });
    return error({ error: new Error(String(err)), tag: tagOrOnError });
  }
}

/**
 * Wraps an async function in a try-catch block and returns a Promise of a typed Result object.
 * Provides two overloads:
 * 1. With an error handler function
 * 2. With an error tag string
 *
 * @template R - The return type of the wrapped async function
 * @template T - The error tag type
 * @param fn - The async function to wrap
 * @param tagOrOnError - Either an error tag string or an error handler function
 * @returns A Promise of a Result object (either Success<R> or Err<Error, T>)
 *
 * @example
 * // Using with an error handler function
 * const result = await tryCatchAsync(
 *   () => fetch("https://api.example.com/data"),
 *   (err) => error({
 *     error: new Error("API request failed"),
 *     tag: "API_ERROR"
 *   })
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "API_ERROR"; } | { status: "success"; data: Response; }
 *
 * @example
 * // Using with an error tag string
 * const result = await tryCatchAsync(
 *   async () => {
 *     const response = await fetch("https://api.example.com/user");
 *     const data = await response.json();
 *     return { id: data.id, name: data.name };
 *   },
 *   "FETCH_ERROR"
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "FETCH_ERROR"; } | { status: "success"; data: { id: number; name: string }; }
 */
export function tryCatchAsync<R, T extends string>(
  fn: () => Promise<R>,
  onError: OnError<T>
): Promise<Success<R> | ReturnType<OnError<T>>>;
export function tryCatchAsync<R, T extends string>(
  fn: () => Promise<R>,
  tag: T
): Promise<Success<R> | Err<Error, T>>;
export async function tryCatchAsync<R, T extends string>(
  fn: () => Promise<R>,
  tagOrOnError?: T | OnError<T>,
  onError?: OnError<T>
): Promise<Success<R> | Err<Error, T> | ReturnType<OnError<T>>> {
  try {
    return ok({ data: await fn() });
  } catch (err) {
    if (typeof tagOrOnError === "function") return tagOrOnError(err);
    if (!tagOrOnError) throw new Error("Tag is required");
    if (err instanceof Error) return error({ error: err, tag: tagOrOnError });
    return error({ error: new Error(String(err)), tag: tagOrOnError });
  }
}

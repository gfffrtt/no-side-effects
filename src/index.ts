/**
 * Creates a strongly-typed error result object.
 *
 * @template E - The error type, must extend Error
 * @template T - The error tag type, must be a string
 * @param error - The error instance
 * @param tag - A string tag to identify the error type
 * @returns A typed error result object with status "error"
 *
 * @example
 * // Basic usage
 * const err = error(
 *   new Error("Not found"),
 *   "NOT_FOUND"
 * );
 * err
 * // ^? const err: { status: "error"; error: Error; tag: "NOT_FOUND"; }
 */
export const error = <E extends Error, T extends string>(error: E, tag: T) => {
  return { status: "error", error, tag } as const;
};

/**
 * Creates a strongly-typed success result object.
 *
 * @template D - The data type
 * @param data - The success data (optional)
 * @returns A typed success result object with status "success" and optional data
 *
 * @example
 * // Basic usage with string data
 * const result = ok("Operation successful");
 * result
 * // ^? const result: { status: "success"; data: string; }
 *
 * @example
 * // With complex data type
 * interface User { id: number; name: string; }
 * const user: User = { id: 1, name: "John" };
 * const result = ok(user);
 * result
 * // ^? const result: { status: "success"; data: User; }
 *
 * @example
 * // Without data
 * const result = ok();
 * result
 * // ^? const result: { status: "success"; }
 */
export function ok<D>(data: D): { status: "success"; data: D };
export function ok(): { status: "success" };
export function ok<D>(data?: D): { status: "success"; data?: D } {
  return { status: "success", data } as const;
}

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
 * const handleApiError: OnError<"API_ERROR"> = (err) => error(
 *   new Error("API request failed"),
 *   "API_ERROR"
 * );
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
 * // Using with an error handler function and return data
 * const result = tryCatch(
 *   () => JSON.parse('{"invalid": json}'),
 *   (err) => error(
 *     new Error("Parse failed"),
 *     "PARSE_ERROR"
 *   )
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "PARSE_ERROR"; } | { status: "success"; data: any; }
 *
 * @example
 * // Using with an error tag string and return data
 * const result = tryCatch(
 *   () => localStorage.getItem("user"),
 *   "STORAGE_ERROR"
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "STORAGE_ERROR"; } | { status: "success"; data: string; }
 *
 * @example
 * // Using without return data
 * const result = tryCatch(
 *   () => {
 *     db.insert("users").values({ id: 1, name: "John" });
 *     return ok();
 *   },
 *   "DATABASE_ERROR"
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "DATABASE_ERROR"; } | { status: "success"; }
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
    return ok(fn());
  } catch (err) {
    if (typeof tagOrOnError === "function") return tagOrOnError(err);
    if (!tagOrOnError) throw new Error("Tag is required");
    if (err instanceof Error) return error(err, tagOrOnError);
    return error(new Error(String(err)), tagOrOnError);
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
 * // Using with an error handler function and return data
 * const result = await tryCatchAsync(
 *   () => fetch("https://api.example.com/data"),
 *   (err) => error(
 *     new Error("API request failed"),
 *     "API_ERROR"
 *   )
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "API_ERROR"; } | { status: "success"; data: Response; }
 *
 * @example
 * // Using with an error tag string and return data
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
 *
 * @example
 * // Using without return data
 * const result = await tryCatchAsync(
 *   async () => {
 *     await fetch("https://api.example.com/logout", { method: "POST" });
 *     return ok();
 *   },
 *   "LOGOUT_ERROR"
 * );
 * result
 * // ^? const result: { status: "error"; error: Error; tag: "LOGOUT_ERROR"; } | { status: "success"; }
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
    return ok(await fn());
  } catch (err) {
    if (typeof tagOrOnError === "function") return tagOrOnError(err);
    if (!tagOrOnError) throw new Error("Tag is required");
    if (err instanceof Error) return error(err, tagOrOnError);
    return error(new Error(String(err)), tagOrOnError);
  }
}

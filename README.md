# no-side-effects

A strongly-typed error handling utility for TypeScript that helps you manage side effects and errors in a type-safe and predictable way.

## Features

- 🎯 **Type-Safe**: Full TypeScript support with generic types for both success and error cases
- 🔒 **Predictable Error Flow**: Standardized way to handle and propagate errors
- 🔍 **Error Context**: Preserve error context through the cause chain while keeping client messages safe
- 🛠️ **Maintainable**: Consistent error handling patterns across your codebase
- 🔐 **Security**: Clear separation between client-safe messages and internal error details

## Installation

```bash
# Using npm
npm install no-side-effects

# Using yarn
yarn add no-side-effects

# Using pnpm
pnpm add no-side-effects

# Using bun
bun add no-side-effects
```

## Quick Start

```typescript
import { tryCatch, tryCatchAsync } from "no-side-effects";

// Synchronous operations
const parseResult = tryCatch(
  () => JSON.parse('{"name": "John"}'),
  "JSON_PARSE_ERROR"
);

if (parseResult.status === "success") {
  console.log(parseResult.data); // { name: "John" }
} else {
  console.error(parseResult.error); // Error with tag "JSON_PARSE_ERROR"
}

// Asynchronous operations
const fetchUser = async (id: string) => {
  const result = await tryCatchAsync(
    async () => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.json();
    },
    (err) =>
      error({
        error: new Error(
          "Unable to retrieve user information", // Client-safe message
          { cause: err } // Internal details
        ),
        tag: "USER_FETCH_ERROR",
      })
  );

  return result;
};
```

## Core Concepts

### Result Types

The library provides two main result types:

- `Success<T>` - Represents successful operations with data of type T
- `Err<E, T>` - Represents failed operations with an error of type E and a tag T

### Error Handling Functions

- `tryCatch`: Wraps synchronous operations
- `tryCatchAsync`: Wraps asynchronous operations
- `error`: Creates error results
- `ok`: Creates success results

## Best Practices

1. **Use Descriptive Error Tags**

```typescript
// ✅ Good
tryCatch(parseJson, "JSON_PARSE_ERROR");

// ❌ Bad
tryCatch(parseJson, "error"); // Too generic
```

2. **Separate Client Messages from Internal Details**

```typescript
tryCatch(
  () => riskyOperation(),
  (err) =>
    error({
      error: new Error(
        "The operation could not be completed", // Client-safe
        { cause: err } // Internal details preserved
      ),
      tag: "OPERATION_ERROR",
    })
);
```

3. **Always Use Pattern Matching**

```typescript
const result = tryCatch(operation, "OPERATION_ERROR");
if (result.status === "success") {
  console.log(result.data);
} else {
  console.error(result.error.cause);
  displayError(result.error.message);
}
```

For more detailed guidelines and examples, check out our [Style Guide](./recommended-cursor-rule.md).

## API Reference

### `tryCatch`

```typescript
function tryCatch<R, T extends string>(
  fn: () => R,
  onError: OnError<T>
): Success<R> | ReturnType<OnError<T>>;

function tryCatch<R, T extends string>(
  fn: () => R,
  tag: T
): Success<R> | Err<Error, T>;
```

### `tryCatchAsync`

```typescript
function tryCatchAsync<R, T extends string>(
  fn: () => Promise<R>,
  onError: OnError<T>
): Promise<Success<R> | ReturnType<OnError<T>>>;

function tryCatchAsync<R, T extends string>(
  fn: () => Promise<R>,
  tag: T
): Promise<Success<R> | Err<Error, T>>;
```

### `error`

```typescript
function error<E extends Error, T extends string>(payload: {
  error: E;
  tag: T;
}): Err<E, T>;
```

### `ok`

```typescript
function ok<D>(payload: { data: D }): Success<D>;
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

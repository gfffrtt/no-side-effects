# Style Guide: Error Handling with `no-side-effects`

This guide provides best practices for using the error handling utilities provided by `no-side-effects` to handle side effects and errors in your TypeScript code.

## Core Concepts

### Result Types

The library provides two main result types:

- `Success<T>` - Represents successful operations with data of type T
- `Err<E, T>` - Represents failed operations with an error of type E and a tag T

### Error Message Structure

When creating errors, follow this pattern:

```typescript
new Error(clientMessage, { cause: internalError });
```

where:

- `clientMessage`: A user-friendly, safe-to-display message that doesn't expose internal details
- `cause`: The original error or technical details that should only be logged/used internally

## Best Practices

### 1. Use Descriptive Error Tags

Error tags should be:

- UPPERCASE_SNAKE_CASE
- Domain-specific and descriptive
- Consistent across related operations

```typescript
// ✅ Good
tryCatch(parseJson, "JSON_PARSE_ERROR");
tryCatch(fetchUser, "USER_FETCH_ERROR");

// ❌ Bad
tryCatch(parseJson, "error"); // Too generic
tryCatch(fetchUser, "err_1"); // Not descriptive
```

### 2. Error Handler Functions

When handling errors, separate client-facing messages from internal details:

```typescript
// ✅ Good
tryCatch(
  () => JSON.parse(input),
  (err) =>
    error(
      new Error(
        "Unable to process the input data", // Client-safe message
        { cause: err } // Internal technical details
      ),
      "JSON_PARSE_ERROR"
    )
);

// ❌ Bad - Exposing internal error details to client
tryCatch(
  () => JSON.parse(input),
  (err) =>
    error(
      new Error(err.message), // Don't expose internal error messages!
      "ERROR"
    )
);
```

### 3. Async Operations

Always use `tryCatchAsync` for promises and async operations:

```typescript
// ✅ Good
const result = await tryCatchAsync(async () => {
  const response = await fetch(url);
  return response.json();
}, "API_ERROR");

// ❌ Bad - Using tryCatch with async operations
const result = tryCatch(async () => {
  // This will return a Promise!
  const response = await fetch(url);
  return response.json();
}, "API_ERROR");
```

### 4. Error Propagation

Always provide both client-safe messages and preserve internal error context:

```typescript
// ✅ Good
tryCatch(
  () => riskyOperation(),
  (err) =>
    error(
      new Error(
        "The operation could not be completed", // Client-safe
        { cause: err } // Internal details preserved
      ),
      "OPERATION_ERROR"
    )
);

// ❌ Bad - Exposing internal details in main message
tryCatch(
  () => riskyOperation(),
  (err) =>
    error(
      new Error(
        `Operation failed: ${err.message}`, // Don't expose internal details!
        { cause: err }
      ),
      "OPERATION_ERROR"
    )
);
```

### 5. Success Results

When creating success results, be explicit about the data structure when passing data:

```typescript
// ✅ Good - With data
const result = ok({
  id: user.id,
  name: user.name,
});

// ✅ Good - Without data when no return value is needed
const result = ok();

// ❌ Bad - Implicit or unclear data structure
const result = ok(user);
```

### 6. Pattern Matching

Use pattern matching with status field for handling results:

```typescript
// ✅ Good
const result = tryCatch(operation, "OPERATION_ERROR");
if (result.status === "success") {
  // TypeScript knows result.data is available here
  console.log(result.data);
} else {
  // Log the internal error for debugging
  console.error(result.error.cause);
  // Display the client-safe message
  displayError(result.error.message);
}

// ❌ Bad - Type unsafe access
const result = tryCatch(operation, "OPERATION_ERROR");
console.log(result.data); // Might not exist!
```

### 7. Reusable Error Handlers

Create reusable error handlers with consistent client-safe messages:

```typescript
// ✅ Good
const handleApiError: OnError<"API_ERROR"> = (err) =>
  error(
    new Error(
      "The service is temporarily unavailable", // Client-safe message
      { cause: err } // Internal details
    ),
    "API_ERROR"
  );

const result = tryCatch(apiCall, handleApiError);

// ❌ Bad - Inconsistent error handling
const result1 = tryCatch(apiCall1, (err) =>
  error(
    new Error(err.message), // Inconsistent and unsafe
    "API_ERROR"
  )
);
```

## Common Patterns

### HTTP Requests

```typescript
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
      error(
        new Error(
          "Unable to retrieve user information", // Client-safe
          { cause: err } // Internal details
        ),
        "USER_FETCH_ERROR"
      )
  );

  return result;
};
```

### Database Operations

```typescript
const saveUser = async (user: User) => {
  return tryCatchAsync(
    async () => {
      await db.transaction(async (trx) => {
        await trx.insert(user).into("users");
      });
      return user;
    },
    (err) =>
      error(
        new Error(
          "Failed to save user information", // Client-safe
          { cause: err } // Internal details
        ),
        "DB_WRITE_ERROR"
      )
  );
};
```

### File Operations

```typescript
const readConfig = () => {
  return tryCatch(
    () => JSON.parse(fs.readFileSync("config.json", "utf-8")),
    (err) =>
      error(
        new Error(
          "Unable to load application configuration", // Client-safe
          { cause: err } // Internal details
        ),
        "CONFIG_ERROR"
      )
  );
};
```

## Benefits

1. **Type Safety**: Full TypeScript support for error handling
2. **Predictable Error Flow**: Standardized way to handle and propagate errors
3. **Error Context**: Preserve error context through the cause chain while keeping client messages safe
4. **Maintainable**: Consistent error handling patterns across your codebase
5. **Security**: Clear separation between client-safe messages and internal error details

## Anti-patterns to Avoid

1. ❌ Don't mix `try/catch` with `tryCatch`/`tryCatchAsync`
2. ❌ Don't use generic error tags
3. ❌ Don't expose internal error details in the main error message
4. ❌ Don't use `tryCatch` for async operations
5. ❌ Don't access result properties without checking status
6. ❌ Don't pass technical error details in the main error message

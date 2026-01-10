# Testing Guide

This directory contains the testing setup and utilities for the project.

## Structure

- `setup.ts` - Global test configuration and mocks
- `utils.tsx` - Custom render function with providers
- `mocks/` - MSW handlers and server setup for API mocking

## Running Tests

### Unit Tests (Vitest)

```bash
# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen
```

## Writing Unit Tests

### Example: Testing a Utility Function

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFunction";

describe("myFunction", () => {
  it("should do something", () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Example: Testing a React Component

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Using MSW for API Mocking

```typescript
import { describe, it, expect } from "vitest";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@/test/utils";

describe("Component with API", () => {
  it("should fetch and display data", async () => {
    server.use(
      http.get("/api/data", () => {
        return HttpResponse.json({ data: "test" });
      })
    );

    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });
  });
});
```

## Writing E2E Tests

E2E tests use Playwright with Page Object Model pattern. See `e2e/` directory for examples.

## Best Practices

1. **Use `vi` for mocks and spies** - Leverage Vitest's mocking capabilities
2. **Test from user perspective** - Use React Testing Library queries that match user interactions
3. **Use data-testid sparingly** - Prefer accessible queries (getByRole, getByLabelText, etc.)
4. **Isolate tests** - Each test should be independent
5. **Use MSW for API mocking** - Don't make real API calls in unit tests
6. **Follow Page Object Model** - For E2E tests, use the POM pattern for maintainability


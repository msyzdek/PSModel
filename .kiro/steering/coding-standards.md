# Coding Standards & Best Practices

## Python Standards

### Formatting & Style
- **Line length**: 100 characters maximum
- **Formatter**: Black with default settings
- **Import sorting**: isort with Black profile
- **Python version**: 3.11+
- **Indentation**: 4 spaces

### Linting & Type Checking
- **Linter**: Ruff (replaces flake8, pyflakes, pyupgrade)
- **Type checker**: mypy with strict settings
- **Required**: Type hints on all function definitions
- **Disallow**: untyped defs, incomplete defs, implicit optional

### Code Quality Rules
- Use type hints for all function parameters and return types
- Prefer explicit over implicit
- Use dataclasses or Pydantic models for structured data
- Handle exceptions explicitly, avoid bare except
- Use context managers (with statements) for resources
- Prefer list/dict comprehensions over loops when readable
- Use f-strings for string formatting
- Avoid mutable default arguments

### Testing
- **Framework**: pytest
- **Coverage**: Aim for >80% coverage on business logic
- **Test files**: `test_*.py` pattern
- **Fixtures**: Use pytest fixtures for setup/teardown

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── services/
│   ├── api/
│   └── utils/
├── tests/
├── pyproject.toml
└── requirements.txt
```

## Next.js / TypeScript Standards

### Formatting & Style
- **Line length**: 100 characters maximum
- **Formatter**: Prettier
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: ES5 style
- **Indentation**: 2 spaces

### Linting Rules
- **ESLint**: Next.js core web vitals + TypeScript recommended
- **No unused variables**: Error (except prefixed with `_`)
- **No console.log**: Warn (allow console.warn, console.error)
- **Prefer const**: Error
- **No var**: Error
- **TypeScript any**: Warn (avoid when possible)

### TypeScript Best Practices
- Use explicit types for function parameters and return values
- Prefer interfaces for object shapes
- Use type for unions and intersections
- Avoid `any` - use `unknown` if type is truly unknown
- Enable strict mode in tsconfig.json
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### React Best Practices
- Use functional components with hooks
- Prefer named exports over default exports
- Keep components small and focused (single responsibility)
- Extract custom hooks for reusable logic
- Use React.memo() for expensive components
- Proper dependency arrays in useEffect/useCallback/useMemo

### File Naming Conventions
- Components: PascalCase (e.g., `ProfitShareCalculator.tsx`)
- Utilities/hooks: camelCase (e.g., `useCalculation.ts`, `formatCurrency.ts`)
- API routes: kebab-case (e.g., `profit-share.ts`)
- Test files: `*.test.ts` or `*.test.tsx`

### Project Structure
```
frontend/
├── app/
│   ├── (routes)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   └── features/
├── lib/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── public/
└── tests/
```

## General Principles

### Code Organization
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names
- Avoid deep nesting (max 3-4 levels)
- Group related code together
- Separate business logic from presentation

### Error Handling
- Always handle errors explicitly
- Provide meaningful error messages
- Log errors with context
- Use custom error types when appropriate
- Validate inputs at boundaries (API, user input)

### Security
- Never commit secrets or API keys
- Validate and sanitize all user inputs
- Use environment variables for configuration
- Follow principle of least privilege
- Keep dependencies updated

### Performance
- Avoid premature optimization
- Profile before optimizing
- Use appropriate data structures
- Cache expensive computations
- Lazy load when appropriate

### Documentation
- Write self-documenting code with clear names
- Add comments for complex logic or "why" not "what"
- Keep README updated with setup instructions
- Document API endpoints and data models
- Use JSDoc/docstrings for public APIs

## Git Workflow

### Commit Messages
- Use conventional commits format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep first line under 72 characters
- Add body for complex changes

### Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Hotfix: `hotfix/description`

### Code Review
- Keep PRs small and focused
- Write descriptive PR descriptions
- Address all review comments
- Ensure CI passes before merging

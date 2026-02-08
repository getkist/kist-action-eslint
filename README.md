# @getkist/action-eslint

ESLint linting actions for kist.

## Installation

```bash
npm install @getkist/action-eslint
```

## Usage

### As a kist plugin

```yaml
# kist.yml
plugins:
  - "@getkist/action-eslint"

pipeline:
  - action: LintAction
    options:
      targetFiles:
        - "src/**/*.ts"
        - "src/**/*.js"
      fix: false
      configPath: "eslint.config.js"
```

### Standalone usage

```typescript
import { LintAction } from "@getkist/action-eslint";

const action = new LintAction();
await action.execute({
  targetFiles: ["src/**/*.ts"],
  fix: true,
  configPath: "eslint.config.js"
});
```

## Actions

### LintAction

Runs ESLint on specified files and directories, with optional auto-fixing.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetFiles` | `string[]` | `["src/**/*.ts"]` | Files or glob patterns to lint |
| `fix` | `boolean` | `false` | Whether to automatically fix issues |
| `configPath` | `string` | `"eslint.config.js"` | Path to ESLint config file |

## Configuration Examples

### Lint TypeScript and JavaScript files

```yaml
- action: LintAction
  options:
    targetFiles:
      - "src/**/*.ts"
      - "src/**/*.tsx"
      - "src/**/*.js"
      - "src/**/*.jsx"
```

### Auto-fix issues

```yaml
- action: LintAction
  options:
    targetFiles:
      - "src/**/*.ts"
    fix: true
```

### Use custom config

```yaml
- action: LintAction
  options:
    targetFiles:
      - "src/**/*.ts"
    configPath: "config/eslint.custom.js"
```

## License

MIT
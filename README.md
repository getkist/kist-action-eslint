# @getkist/action-eslint

<div align="center">

[![npm version](https://img.shields.io/npm/v/@getkist/action-eslint?style=flat-square&logo=npm&logoColor=FFFFFF&labelColor=5e4d34&color=5e4d34)](https://www.npmjs.com/package/@getkist/action-eslint)
[![License: MIT](https://img.shields.io/badge/License-MIT-5e4d34?style=flat-square)](https://opensource.org/licenses/MIT)
[![kist plugin](https://img.shields.io/badge/kist-plugin-5e4d34?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN3Y2YzAgNS41NSAzLjg0IDEwLjc0IDEwIDEyIDYuMTYtMS4yNiAxMC02LjQ1IDEwLTEyVjdMMTIgMnoiLz48L3N2Zz4=)](https://github.com/getkist/kist)

</div>

ESLint linting actions for [kist](https://github.com/getkist/kist) build tool.

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

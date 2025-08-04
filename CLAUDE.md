# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan & Review

### Before starting work
- Always in plan mode to make a plan
- After get the plan, make sure you Write the plan to .claude/tasks/TASK_NAME.md.
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
- If the task require external knowledge or certain package, also research to get latest knowledge (Use Task tool for research)
- Don't over plan it, always think MVP.
- Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing
- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

CCXT is a JavaScript/TypeScript/Python/C#/PHP/Go cryptocurrency trading library with support for 100+ exchanges. The library provides:
- Unified API for interacting with cryptocurrency exchanges
- Support for public (market data) and private (trading) APIs
- WebSocket support for real-time data
- Multi-language support through transpilation from TypeScript source

## Architecture

### Source Code Structure
- **Primary source**: TypeScript files in `ts/src/` 
- **Base classes**: Located in `ts/src/base/` containing core exchange functionality
- **Exchange implementations**: Individual exchange files in `ts/src/*.ts` (e.g., `binance.ts`, `kraken.ts`)
- **WebSocket support**: Pro implementations in `ts/src/pro/`
- **Tests**: Located in language-specific test directories

### Transpilation Flow
The TypeScript source is transpiled to other languages:
- JavaScript → `js/`
- Python → `python/`
- PHP → `php/`
- C# → `cs/`
- Go → `go/`

**Important**: Never edit transpiled files directly. Always modify the TypeScript source in `ts/src/`.

## Common Development Commands

### Building
```bash
# Full build (includes transpilation to all languages)
npm run build

# Fast build (parallel transpilation)
npm run force-build

# Build without Go transpilation (faster)
npm run force-build//WithoutGo

# Language-specific builds
npm run csharp  # Build C# version
npm run go      # Build Go version
```

### Linting and Type Checking
```bash
# Run ESLint on TypeScript files
npm run lint

# Check JavaScript syntax
npm run check-js-syntax

# Check Python syntax (uses ruff)
npm run check-python-syntax

# Check PHP syntax
npm run check-php-syntax

# Run all syntax checks
npm run check-syntax
```

### Testing
```bash
# Run live tests (requires API keys)
npm run live-tests

# Run tests for specific languages
npm run live-tests-rest-js    # JavaScript REST tests
npm run live-tests-ws-js      # JavaScript WebSocket tests
npm run live-tests-rest-py    # Python REST tests
npm run live-tests-rest-php   # PHP REST tests
npm run live-tests-rest-csharp # C# REST tests
npm run live-tests-rest-go    # Go REST tests

# Run request/response tests
npm run request-tests
npm run response-tests

# Run id tests
npm run id-tests

# Test a single exchange
npm run ti-js -- --exchange=binance
npm run ti-py -- --exchange=binance
```

### Transpilation
```bash
# Transpile REST implementations
npm run transpileRest

# Transpile WebSocket implementations  
npm run transpileWs

# Force transpile (ignores cache)
npm run force-transpile

# Fast parallel transpilation
npm run force-transpile-fast
```

## Development Workflow

1. **Before making changes**: Run `git config core.hooksPath .git-templates/hooks` to set up git hooks
2. **Edit source files**: Only modify TypeScript files in `ts/src/`
3. **Build**: Run `npm run build` to transpile changes
4. **Test**: Run appropriate test commands to verify changes
5. **Lint**: Ensure code passes `npm run lint` before committing

## Important Notes

- **Unified code**: All exchange implementations must follow the unified API structure
- **Do not commit**: Generated files in `/js/*`, `/php/*`, `/python/*`, `/cs/*` (except base classes)
- **Atomic commits**: Submit one pull request per exchange
- **Dependencies**: Node.js 15.0.0+ required

## Python Development

For Python development specifically:
- Use `tox` for testing: `cd python && tox -e qa` for linting with ruff
- Type checking: `cd python && tox -e type` for mypy checks

## Exchange Implementation

When implementing or modifying an exchange:
1. Edit the TypeScript file in `ts/src/<exchange>.ts`
2. Follow the existing exchange structure and unified API
3. Implement both REST and WebSocket (if supported) in separate files
4. Add tests for new functionality
5. Ensure backward compatibility

## CI/CD Hooks

The repository uses git hooks for quality control. Always run `git config core.hooksPath .git-templates/hooks` after cloning to enable pre-commit checks that prevent committing generated files.
# Subcommands Guide

Subcommands allow you to create CLIs with multiple related functions, similar to `git commit`, `docker build`, or `npm install`. Each subcommand can have its own set of arguments while sharing global options.

## Basic Subcommand Structure

```typescript
const cli = await parseCliArguments(
  'my-tool',
  {
    // Subcommand definitions
    build: {
      description: 'Build the project',
      arguments: {
        target: stringArgument({
          description: 'Build target'
        })
      }
    },
    test: {
      description: 'Run tests',
      arguments: {
        coverage: booleanArgument({
          description: 'Generate coverage report',
          character: 'c'
        })
      }
    }
  },
  {
    // Global arguments (available to all subcommands)
    verbose: booleanArgument({
      description: 'Enable verbose output',
      character: 'v'
    })
  }
)
```

## Type Safety with Subcommands

TypeScript provides excellent type safety when using subcommands:

```typescript
// cli.subcommand has type: 'build' | 'test' | undefined

if (cli.subcommand === 'build') {
  // TypeScript knows these are available:
  cli.args.target // string | undefined (from build subcommand)
  cli.args.verbose // boolean (from global args)

  // TypeScript knows these are NOT available:
  // cli.args.coverage // ❌ Type error
}

if (cli.subcommand === 'test') {
  // TypeScript knows these are available:
  cli.args.coverage // boolean (from test subcommand)
  cli.args.verbose // boolean (from global args)

  // TypeScript knows these are NOT available:
  // cli.args.target // ❌ Type error
}

// Global args are always available regardless of subcommand
console.log(cli.args.verbose) // ✅ Always works
```

### Requiring Subcommands

Force users to specify a subcommand:

```typescript
const cli = await parseCliArguments(
  'my-tool',
  {
    build: { description: 'Build project', arguments: {} },
    test: { description: 'Run tests', arguments: {} }
  },
  {},
  {
    requireSubcommand: true
  }
)

// Now cli.subcommand is never undefined
// TypeScript type: 'build' | 'test'
```

### Subcommand-Specific Help

Users can get help for specific subcommands:

```bash
my-tool --help           # Shows general help with all subcommands
my-tool build --help     # Shows help specific to 'build' subcommand
```

### Shared Arguments Across Subcommands

Some arguments might be useful for multiple subcommands:

```typescript
// Helper function to create shared arguments
const createOutputArgs = {
  output: stringArgument({
    description: 'Output directory',
    defaultValue: './dist'
  }),
  quiet: booleanArgument({
    description: 'Suppress output',
    character: 'q'
  })
} as const

const cli = await parseCliArguments(
  'build-tool',
  {
    compile: {
      description: 'Compile source code',
      arguments: {
        ...createOutputArgs,
        optimize: booleanArgument({
          description: 'Enable optimizations',
          character: 'O'
        })
      }
    },
    bundle: {
      description: 'Bundle assets',
      arguments: {
        ...createOutputArgs,
        minify: booleanArgument({
          description: 'Minify output',
          character: 'm'
        })
      }
    }
  },
  {}
)
```

## Error Handling

### Invalid Subcommands

```bash
my-tool invalid-command
# Error: Unknown subcommand: invalid-command
# Available subcommands: build, test, deploy
```

### Partial Matching Conflicts

```bash
# Given subcommands: ['build', 'bundle']
my-tool bu
# Error: Ambiguous subcommand 'bu' matches: build, bundle
```

### Subcommand-Specific Argument Errors

```bash
my-tool build --invalid-arg value
# Error: Unknown argument for 'build' subcommand: --invalid-arg
```

## Real-World Examples

### Package Manager CLI

```typescript
const cli = await parseCliArguments(
  'pkg',
  {
    install: {
      description: 'Install packages',
      arguments: {
        save: booleanArgument({
          description: 'Save to package.json',
          character: 'S'
        }),
        dev: booleanArgument({
          description: 'Save as dev dependency',
          character: 'D'
        })
      }
    },
    uninstall: {
      description: 'Remove packages',
      arguments: {
        save: booleanArgument({
          description: 'Remove from package.json',
          character: 'S'
        })
      }
    },
    update: {
      description: 'Update packages',
      arguments: {
        all: booleanArgument({
          description: 'Update all packages',
          character: 'a'
        })
      }
    },
    list: {
      description: 'List installed packages',
      arguments: {
        depth: numberArgument({
          description: 'Dependency depth to show',
          defaultValue: 0
        })
      }
    }
  },
  {
    global: booleanArgument({
      description: 'Use global package directory',
      character: 'g'
    })
  }
)
```

### Database CLI

```typescript
const cli = await parseCliArguments(
  'db-tool',
  {
    migrate: {
      description: 'Run database migrations',
      arguments: {
        up: booleanArgument({
          description: 'Run up migrations',
          character: 'u'
        }),
        down: booleanArgument({
          description: 'Run down migrations',
          character: 'd'
        }),
        steps: numberArgument({
          description: 'Number of migrations to run'
        })
      }
    },
    seed: {
      description: 'Seed database with data',
      arguments: {
        file: stringArgument({
          description: 'Seed file to run'
        })
      }
    },
    backup: {
      description: 'Backup database',
      arguments: {
        output: stringArgument({
          description: 'Backup file path',
          defaultValue: `backup-${new Date().toISOString().split('T')[0]}.sql`
        })
      }
    },
    restore: {
      description: 'Restore database from backup',
      arguments: {
        file: stringArgument({
          description: 'Backup file to restore'
        }),
        force: booleanArgument({
          description: 'Force restore without confirmation',
          character: 'f'
        })
      }
    }
  },
  {
    database: stringArgument({
      description: 'Database connection string'
    }),
    dryRun: booleanArgument({
      description: 'Show what would be done without executing',
      character: 'n'
    })
  }
)
```

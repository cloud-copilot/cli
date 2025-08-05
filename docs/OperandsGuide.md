# Operands Guide

Operands are positional arguments that typically represent files, URLs, or other data your CLI tool operates on. This guide covers how to work with operands and the `expectOperands` configuration option.

## Table of Contents

- [What Are Operands?](#what-are-operands)
- [Default Behavior (expectOperands: true)](#default-behavior-expectoperands-true)
- [Disabling Operands (expectOperands: false)](#disabling-operands-expectoperands-false)
- [Type Safety Benefits](#type-safety-benefits)
- [When to Use Each Approach](#when-to-use-each-approach)
- [Examples](#examples)

## What Are Operands?

Operands are positional arguments that come after flags and options. They're commonly used for:

- File paths: `my-tool --verbose file1.txt file2.txt`
- URLs: `download-tool --format json https://api.example.com`
- Commands: `git clone --depth 1 repo-url`

## Default Behavior (expectOperands: true)

By default, `expectOperands` is `true`, meaning your CLI accepts operands.

```typescript
const cli = await parseCliArguments(
  'file-processor',
  {},
  {
    verbose: booleanArgument({
      description: 'Enable verbose output',
      character: 'v'
    })
  }
  // expectOperands defaults to true
)

// cli.operands has type: string[]
console.log('Files to process:', cli.operands)
cli.operands.forEach((file) => processFile(file))
```

**Features:**

- `cli.operands` has type `string[]`
- Help message includes operands in usage line
- Supports `--` separator to explicitly separate arguments from operands
- Runtime validation allows operands

## Disabling Operands (expectOperands: false)

When your CLI only works with flags and arguments, set `expectOperands: false`.

```typescript
const cli = await parseCliArguments(
  'config-tool',
  {},
  {
    validate: booleanArgument({
      description: 'Validate configuration'
    }),
    config: stringArgument({
      description: 'Configuration file path'
    })
  },
  {
    expectOperands: false // No operands allowed
  }
)

// cli.operands has type: never
// ❌ TypeScript compilation error:
// console.log(cli.operands)  // Cannot access property of 'never'
```

**Features:**

- `cli.operands` has type `never` (cannot be accessed)
- Help message excludes operands from usage line
- Runtime validation rejects any operands
- Compile-time type safety prevents operand access

## Type Safety Benefits

### With expectOperands: true (default)

```typescript
const cli = await parseCliArguments(/* ... */)

// ✅ These work fine:
cli.operands.length          // number
cli.operands.forEach(...)    // OK
const files = cli.operands   // string[]
```

### With expectOperands: false

```typescript
const cli = await parseCliArguments(/* ... */, { expectOperands: false })

// ❌ TypeScript compilation errors:
cli.operands.length          // Error: Cannot read property of 'never'
cli.operands.forEach(...)    // Error: Cannot read property of 'never'
const files = cli.operands   // Error: Type 'never' not assignable
```

This compile-time protection prevents bugs where you might accidentally try to process operands that shouldn't exist.

## When to Use Each Approach

### Use expectOperands: true (default) for:

- File processing tools: `my-tool file1.txt file2.txt`
- URL downloaders: `fetch-tool url1 url2 url3`
- Package managers: `install package1 package2`
- Compilers: `compiler source1.ts source2.ts`

### Use expectOperands: false for:

- Configuration tools: `config-tool --validate --format json`
- Status checkers: `health-check --endpoint api --timeout 30`
- Initializers: `init-tool --template react --typescript`
- Utilities that work entirely with flags: `cleanup --force --dry-run`

## Examples

### File Processor (expectOperands: true)

```typescript
// Example: my-tool --verbose --output dist/ file1.txt file2.txt
const cli = await parseCliArguments(
  'file-processor',
  {},
  {
    verbose: booleanArgument({ description: 'Verbose output', character: 'v' }),
    output: stringArgument({ description: 'Output directory' })
  }
  // expectOperands defaults to true
)

if (cli.operands.length === 0) {
  console.log('No input files provided')
  process.exit(1)
}

cli.operands.forEach((file) => {
  if (cli.args.verbose) {
    console.log(`Processing ${file}...`)
  }
  processFile(file, cli.args.output)
})
```

### Config Tool (expectOperands: false)

```typescript
// Example: config-tool --validate --config settings.json
const cli = await parseCliArguments(
  'config-tool',
  {},
  {
    validate: booleanArgument({ description: 'Validate only', character: 'c' }),
    config: stringArgument({ description: 'Config file path' }),
    format: stringArgument({ description: 'Output format', defaultValue: 'table' })
  },
  {
    expectOperands: false // Only flags and options
  }
)

// No need to check operands - they can't exist!
// cli.operands is not accessible at compile time

const configPath = cli.args.config || './config.json'
const config = loadConfig(configPath)

if (cli.args.validate) {
  validateConfig(config, cli.args.format)
} else {
  runWithConfig(config)
}
```

## Error Messages

### Runtime Errors with expectOperands: false

When users provide operands to a CLI with `expectOperands: false`, they get clear error messages:

```bash
$ config-tool --validate extra-arg
# Error: Operands are not expected but received: extra-arg

$ config-tool --config settings.json file1.txt file2.txt
# Error: Operands are not expected but received: file1.txt, file2.txt
```

### Help Message Differences

**With expectOperands: true:**

```
Usage: file-processor [options] [flags] [--] [operand1] [operand2]
```

**With expectOperands: false:**

```
Usage: config-tool [options] [flags]
```

## Best Practices

1. **Choose the right default**: Most CLIs expect operands, so the default is usually correct
2. **Be explicit when disabling**: If your tool doesn't need operands, explicitly set `expectOperands: false`
3. **Use descriptive operand names**: Set `operandsName` to something meaningful like "files", "urls", or "packages"
4. **Validate operand count**: Check if you have the right number of operands when using `expectOperands: true`
5. **Leverage type safety**: Let TypeScript prevent operand-related bugs at compile time

## See Also

- [API Reference](APIReference.md) - Complete API documentation
- [Examples](../src/demo/) - Working examples including operands.ts and noOperands.ts
- [Getting Started](GettingStarted.md) - Basic CLI setup

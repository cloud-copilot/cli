# Getting Started

This guide will walk you through creating your first CLI application with `@cloud-copilot/cli`.

## Installation

```bash
npm install @cloud-copilot/cli
```

## Your First CLI

Let's create a simple file processor CLI that demonstrates the core concepts.

### Step 1: Basic Setup

Create a new file `my-cli.ts`:

```typescript
import { parseCliArguments, stringArgument, booleanArgument } from '@cloud-copilot/cli'

const cli = await parseCliArguments(
  'my-cli',
  {}, // No subcommands for now
  {
    input: stringArgument({
      description: 'Input file to process'
    }),
    verbose: booleanArgument({
      description: 'Enable verbose output',
      character: 'v'
    })
  }
)

console.log('Arguments received:', cli.args)
```

### Step 2: Run Your CLI

```bash
npx tsx my-cli.ts --input file.txt --verbose
# Output: Arguments received: { input: 'file.txt', verbose: true }

npx tsx my-cli.ts --help
# Shows automatically generated help
```

### Step 3: Add Type Safety

Notice how TypeScript knows the exact types:

```typescript
// TypeScript knows these types automatically:
cli.args.input // string | undefined
cli.args.verbose // boolean

if (cli.args.input) {
  // TypeScript knows input is string here
  console.log(`Processing file: ${cli.args.input}`)
}
```

### Step 4: Add Default Values

```typescript
const cli = await parseCliArguments(
  'my-cli',
  {},
  {
    input: stringArgument({
      description: 'Input file to process',
      defaultValue: 'input.txt' // Now input is string, not string | undefined
    }),
    output: stringArgument({
      description: 'Output file',
      defaultValue: 'output.txt'
    }),
    verbose: booleanArgument({
      description: 'Enable verbose output',
      character: 'v'
    })
  }
)

// Now TypeScript knows these are always defined:
cli.args.input // string (not undefined)
cli.args.output // string (not undefined)
cli.args.verbose // boolean
```

### Step 5: Add Multiple Values

```typescript
import { stringArrayArgument, numberArgument } from '@cloud-copilot/cli'

const cli = await parseCliArguments(
  'my-cli',
  {},
  {
    files: stringArrayArgument({
      description: 'Files to process'
    }),
    workers: numberArgument({
      description: 'Number of worker threads',
      defaultValue: 1
    }),
    verbose: booleanArgument({
      description: 'Enable verbose output',
      character: 'v'
    })
  }
)

// Usage: --files file1.txt file2.txt file3.txt --workers 4
// cli.args.files is string[] | undefined
// cli.args.workers is number
```

### Step 6: Add Subcommands

```typescript
const cli = await parseCliArguments(
  'my-cli',
  {
    process: {
      description: 'Process files',
      arguments: {
        format: stringArgument({
          description: 'Output format'
        })
      }
    },
    validate: {
      description: 'Validate files',
      arguments: {
        strict: booleanArgument({
          description: 'Use strict validation',
          character: 's'
        })
      }
    }
  },
  {
    // Global arguments available to all subcommands
    verbose: booleanArgument({
      description: 'Enable verbose output',
      character: 'v'
    })
  }
)

if (cli.subcommand === 'process') {
  // TypeScript knows format is available here
  console.log(`Processing with format: ${cli.args.format}`)
}

if (cli.subcommand === 'validate') {
  // TypeScript knows strict is available here
  console.log(`Strict validation: ${cli.args.strict}`)
}

// Global arguments are always available
console.log(`Verbose mode: ${cli.args.verbose}`)
```

## Common Patterns

### Environment Variable Support

```typescript
const cli = await parseCliArguments(
  'my-cli',
  {},
  {
    apiKey: stringArgument({
      description: 'API key for service'
    })
  },
  {
    envPrefix: 'MY_CLI'
  }
)

// Now MY_CLI_API_KEY environment variable will be used as default
// CLI arguments override environment variables
```

### Version Information

```typescript
const cli = await parseCliArguments(
  'my-cli',
  {},
  {},
  {
    version: '1.0.0'
  }
)

// Users can now run: my-cli --version
```

### Help Customization

```typescript
const cli = await parseCliArguments(
  'my-cli',
  {},
  {
    files: stringArrayArgument({
      description: 'Input files to process'
    })
  },
  {
    operandsName: 'files',
    expectOperands: true, // Default: accepts operands
    allowOperandsFromStdin: true
  }
)

// Help will show: my-cli [options] [--] [files1] [files2]
// And note about reading from stdin
```

### Operands Configuration

```typescript
// For CLIs that work with files, URLs, etc. (default behavior)
const fileProcessor = await parseCliArguments(
  'process-files',
  {},
  { verbose: booleanArgument({ description: 'Verbose output' }) }
  // expectOperands defaults to true
)
fileProcessor.operands // string[] - accessible

// For CLIs that only use flags and options
const configTool = await parseCliArguments(
  'config-tool',
  {},
  { validate: booleanArgument({ description: 'Validate config' }) },
  { expectOperands: false } // Disable operands
)
// configTool.operands  // Type 'never' - not accessible at compile time
```

## Error Handling

The library automatically handles validation and shows helpful error messages:

```bash
# Missing required argument
$ my-cli --workers not-a-number
# Error: Validation error for --workers: "not-a-number" is not a valid number

# Invalid enum value
$ my-cli --format invalid
# Error: Validation error for --format: invalid is not one of the allowed values: json, xml, csv
```

## Next Steps

- Learn about [Built-in Argument Types](BuiltInArguments.md)
- Create [Custom Argument Types](CustomArguments.md)
- Explore [Subcommands Guide](SubcommandsGuide.md)
- Check out [Examples](Examples/) for real-world patterns
- Read the [API Reference](APIReference.md) for complete details

## Best Practices

1. **Use descriptive argument names** - `--input-file` instead of `--if`
2. **Provide good descriptions** - Users see these in help output
3. **Use appropriate default values** - Reduce user friction
4. **Group related functionality** - Use subcommands for complex CLIs
5. **Support environment variables** - Use `envPrefix` for configuration
6. **Add version information** - Help users debug issues
7. **Test error cases** - Ensure good error messages

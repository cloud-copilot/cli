# API Reference

## Main Functions

### `parseCliArguments`

The primary async function for parsing CLI arguments with full type safety.

```typescript
async function parseCliArguments<
  O extends Record<string, Argument<any>>,
  C extends Record<string, Subcommand>,
  A extends AdditionalCliOptions
>(
  command: string,
  subcommands: C,
  cliArgs: O,
  additionalOptions?: A
): Promise<SelectedSubcommandWithArgs<C, O, A>>
```

#### Parameters

- **`command`** (`string`): The name of the command for help text display
- **`subcommands`** (`C`): Object mapping subcommand names to their configurations
- **`cliArgs`** (`O`): Object mapping argument names to their argument definitions
- **`additionalOptions`** (`A`, optional): Configuration options for parsing behavior

#### Returns

Promise resolving to a type-safe result object containing:

- **`args`**: Parsed arguments with full TypeScript type safety
- **`subcommand`**: Selected subcommand name or `undefined`
- **`operands`**: Array of operand strings
- **`anyValues`**: Boolean indicating if any arguments were provided
- **`printHelp()`**: Function to manually print help text

#### Example

```typescript
const cli = await parseCliArguments(
  'my-tool',
  {
    deploy: {
      description: 'Deploy application',
      arguments: {
        env: stringArgument({ description: 'Environment' })
      }
    }
  },
  {
    verbose: booleanArgument({
      description: 'Verbose output',
      character: 'v'
    })
  },
  {
    version: '1.0.0',
    envPrefix: 'MY_TOOL'
  }
)
```

#### Version Options

- **Simple string**: `version: '1.0.0'`
- **Object with update checking**:
  - `currentVersion`: Current version (string or function)
  - `checkForUpdates`: npm package name or custom check function
  - `updateMessage`: Custom message formatter for updates

#### Override Options

- **`args`**: Override `process.argv.slice(2)` for testing
- **`env`**: Override `process.env` for testing
- **`envPrefix`**: Prefix for environment variable names

#### Help Options

- **`operandsName`**: Name for operands in help text (default: "operands")
- **`expectOperands`**: Whether to show operands in usage (default: true)
- **`allowOperandsFromStdin`**: Show stdin note in help (default: false)

#### Behavior Options

- **`requireSubcommand`**: Force subcommand selection (default: false)
- **`showHelpIfNoArgs`**: Show help when no arguments provided (default: false)

### Return Types

#### `SelectedSubcommandWithArgs<C, O, A>`

The return type of `parseCliArguments` provides full type safety based on your configuration.

```typescript
// When no subcommands are defined
type Result = {
  subcommand: never
  args: ParsedArguments<O>
  operands: string[]
  anyValues: boolean
  printHelp: () => void
}

// When subcommands are optional
type Result = {
  subcommand: keyof C | undefined
  args: ParsedArguments<O> & ParsedArguments<C[K]['arguments']>
  operands: string[]
  anyValues: boolean
  printHelp: () => void
}

// When requireSubcommand: true
type Result = {
  [K in keyof C]: {
    subcommand: K
    args: ParsedArguments<O> & ParsedArguments<C[K]['arguments']>
    operands: string[]
    anyValues: boolean
    printHelp: () => void
  }
}[keyof C]
```

#### `ParsedArguments<T>`

Maps argument definitions to their parsed types.

```typescript
type ParsedArguments<T extends Record<string, Argument<any>>> = {
  [K in keyof T]: T[K] extends Argument<infer V> ? V : never
}
```

## Utility Functions

### `readStdin`

Read content from standard input.

```typescript
function readStdin(timeoutMs?: number): Promise<string>
```

**Parameters:**

- `timeoutMs` (number, optional): Timeout in milliseconds for first byte

**Example:**

```typescript
import { readStdin } from '@cloud-copilot/cli'

const input = await readStdin(5000) // 5 second timeout
console.log('Received from stdin:', input)
```

### `createPackageFileReader`

Utility for reading files relative to your package.

```typescript
function createPackageFileReader(packageDir: string): PackageFileReader

interface PackageFileReader {
  readFileSync(relativePath: string): string
  readFile(relativePath: string): Promise<string>
}
```

## Error Handling

The library provides detailed error messages and exits with appropriate codes:

### Exit Codes

- **0**: Success
- **1**: General error (invalid arguments, validation failures)
- **2**: Parsing error (malformed arguments, unknown flags)

### Error Types

```typescript
// Validation errors
"Validation error for --port: "abc" is not a valid number"

// Unknown arguments
"Unknown argument: --invalid-flag"

// Ambiguous partial matches
"Ambiguous argument '--ver' matches: verbose, version"

// Missing required values
"--input requires a value"

// Boolean with values
"--verbose does not accept values but received: value"

// Invalid enum values
"--level must be one of: debug, info, warn, error"
```

## Advanced Usage

### Custom Argument Implementation

```typescript
import { Argument, ValidatedValues } from '@cloud-copilot/cli'

const customArgument = (options: { description: string }): Argument<MyType> => ({
  description: options.description,
  defaultValue: undefined,

  validateValues: async (current, values) => {
    // Your validation logic
    return { valid: true, value: parsedValue }
  },

  reduceValues: async (current, newValue) => {
    // How to combine multiple occurrences
    return newValue
  },

  acceptMultipleValues: () => true // If it can appear multiple times
})
```

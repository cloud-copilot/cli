# Environment Variables

You can use environment variables with to provide default values for your CLI arguments.

## Basic Usage

Enable environment variable support by setting an `envPrefix`:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {
    apiKey: stringArgument({
      description: 'API key for service'
    }),
    port: numberArgument({
      description: 'Server port',
      defaultValue: 3000
    }),
    debug: booleanArgument({
      description: 'Enable debug mode',
      character: 'd'
    })
  },
  {
    envPrefix: 'MY_APP' // Look for MY_APP_* environment variables
  }
)
```

## Environment Variable Naming

The library automatically converts argument names to environment variable names:

| Argument Name | Environment Variable |
| ------------- | -------------------- |
| `apiKey`      | `MY_APP_API_KEY`     |
| `serverPort`  | `MY_APP_SERVER_PORT` |
| `debug`       | `MY_APP_DEBUG`       |
| `outputDir`   | `MY_APP_OUTPUT_DIR`  |

### Naming Rules

1. **Prefix**: Your `envPrefix` + underscore
2. **Conversion**: camelCase → SCREAMING_SNAKE_CASE
3. **Examples**:
   - `envPrefix: 'MY_APP'` + `apiKey` → `MY_APP_API_KEY`
   - `envPrefix: 'CLI'` + `outputDirectory` → `CLI_OUTPUT_DIRECTORY`

## Type-Specific Parsing

Environment variables are strings, but the library parses them according to your argument types:

### String Arguments

```bash
export MY_APP_API_KEY="secret-key-123"
export MY_APP_OUTPUT_DIR="/tmp/output"
```

```typescript
// Parsed as strings directly
cli.args.apiKey // "secret-key-123"
cli.args.outputDir // "/tmp/output"
```

### Number Arguments

```bash
export MY_APP_PORT="8080"
export MY_APP_WORKERS="4"
```

```typescript
// Parsed as numbers
cli.args.port // 8080 (number)
cli.args.workers // 4 (number)
```

### Boolean Arguments

If the environment variable for a boolean argument is set to any value, it will be interpreted as `true`.

```bash
export MY_APP_DEBUG="true".   # Treated as true
export MY_APP_VERBOSE="false" # Treated as true
export MY_APP_QUIET="1"       # Treated as true
export MY_APP_SILENT="0"      # Treated as true
```

```typescript
// Parsed as booleans
cli.args.debug // true
cli.args.verbose // true
cli.args.quiet // true
cli.args.silent // true
```

### Array Arguments

```bash
export MY_APP_FILES="file1.txt file2.txt file3.txt"
export MY_APP_REGIONS="us-east-1 us-west-2 eu-west-1"
```

```typescript
// Parsed as arrays (space-separated)
cli.args.files // ["file1.txt", "file2.txt", "file3.txt"]
cli.args.regions // ["us-east-1", "us-west-2", "eu-west-1"]
```

### Enum Arguments

```bash
export MY_APP_LOG_LEVEL="debug"
export MY_APP_ENVIRONMENT="production"
```

```typescript
enumArgument({
  description: 'Log level',
  validValues: ['debug', 'info', 'warn', 'error']
})

// Validated against validValues
cli.args.logLevel // "debug" (if valid)
cli.args.environment // Error if not in validValues
```

### Map Arguments

Map arguments in environment variables are treated as only only key and multiple values per key.

```bash
export MY_APP_CONFIG="db localhost 127.0.0.1"
```

```typescript
// Parsed as key-value pairs
cli.args.config // { db: ["localhost", "127.0.0.1"]}
```

## Precedence Rules

CLI arguments always override environment variables:

```bash
export MY_APP_PORT="8080"
my-app --port 3000
# Result: port = 3000 (CLI wins)
```

Default values have the lowest precedence:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {
    port: numberArgument({
      description: 'Server port',
      defaultValue: 3000 // Lowest precedence
    })
  },
  { envPrefix: 'MY_APP' }
)

// Precedence (highest to lowest):
// 1. CLI arguments: --port 4000
// 2. Environment: MY_APP_PORT=8080
// 3. Default value: 3000
```

## Validation

Environment variables are validated using the same rules as CLI arguments:

### Type Validation

```bash
export MY_APP_PORT="not-a-number"
my-app
# Error: Invalid value for environment MY_APP_PORT: "not-a-number" is not a valid number
```

### Enum Validation

```bash
export MY_APP_LOG_LEVEL="invalid"
my-app
# Error: Invalid value for environment MY_APP_LOG_LEVEL: "invalid" is not one of the allowed values: debug, info, warn, error
```

### Custom Validation

```typescript
const urlArgument = singleValueArgument<URL>((value) => {
  try {
    return { valid: true, value: new URL(value) }
  } catch {
    return { valid: false, message: 'Invalid URL format' }
  }
})

const cli = await parseCliArguments(
  'my-app',
  {},
  {
    endpoint: urlArgument({
      description: 'API endpoint URL'
    })
  },
  { envPrefix: 'MY_APP' }
)
```

```bash
export MY_APP_ENDPOINT="not-a-url"
my-app
# Error: Invalid value for environment MY_APP_ENDPOINT: Invalid URL format
```

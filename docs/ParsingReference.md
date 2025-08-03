# Parsing Reference

This document provides detailed information about how `@cloud-copilot/cli` parses command-line input.

## Command Structure

All CLI commands follow this structure:

```bash
command [subcommand] [-flags] [--arguments] [--] [operands]
```

### Components

- **command**: Your CLI executable name
- **subcommand**: Optional first positional argument (if configured)
- **arguments**: Named parameters starting with `--` or `-`
- **operands**: Positional values after all arguments

## Subcommand Parsing

### Basic Rules

1. **Position**: Must be the first argument (if present)
2. **No prefix**: Cannot start with `-` or `--`
3. **Optional**: Only parsed if subcommands are configured
4. **Exclusive**: Only one subcommand can be specified

### Partial Matching

The library supports "prefix matching" for subcommands:

```bash
# Given subcommands: ['deploy', 'development', 'destroy']
my-cli dep    # ❌ Error: ambiguous (matches deploy, development)
my-cli depl   # ✅ Matches 'deploy'
my-cli dev    # ✅ Matches 'development'
my-cli dest   # ✅ Matches 'destroy'
```

### Configuration

```typescript
const cli = await parseCliArguments(
  'my-cli',
  {
    deploy: {
      description: 'Deploy the application',
      arguments: {
        /* subcommand-specific args */
      }
    },
    development: {
      description: 'Start development server',
      arguments: {
        /* subcommand-specific args */
      }
    }
  },
  {
    /* global arguments */
  }
)
```

## Argument Parsing

### Argument Formats

Arguments can be specified in several formats:

```bash
# Long form
--verbose
--input file.txt
--files file1.txt file2.txt file3.txt

# Short form (boolean only)
-v
-abc  # Equivalent to -a -b -c

# Mixed
--input file.txt -v
```

### Argument Types

#### Boolean Arguments

```typescript
booleanArgument({
  description: 'Enable verbose mode',
  character: 'v'
})
```

**Parsing rules:**

- Present = `true`, absent = `false`
- Cannot have values: `--verbose value` is an error
- Short form available: `-v`
- Can be combined: `-abc` = `-a -b -c`

**Examples:**

```bash
my-cli --verbose           # verbose: true
my-cli -v                  # verbose: true
my-cli -abc                # a: true, b: true, c: true
my-cli --verbose value     # ❌ Error: boolean args don't accept values
```

#### Single Value Arguments

```typescript
stringArgument({
  description: 'Input file path'
})
```

**Parsing rules:**

- Requires exactly one value
- Can appear only once (multiple occurrences will error)

**Examples:**

```bash
my-cli --input file.txt                    # input: "file.txt"
my-cli --input file1.txt --input file2.txt # input: "file2.txt" (last wins)
```

#### Array Arguments

```typescript
stringArrayArgument({
  description: 'Multiple input files'
})
```

**Parsing rules:**

- Accepts multiple values in one argument
- Can appear multiple times (values accumulate)
- Stops at next argument or `--`

**Examples:**

```bash
my-cli --files a.txt b.txt c.txt           # files: ["a.txt", "b.txt", "c.txt"]
my-cli --files a.txt --files b.txt         # files: ["a.txt", "b.txt"]
my-cli --files a.txt b.txt -- c.txt        # files: ["a.txt", "b.txt"], operands: ["c.txt"]
```

#### Enum Arguments

```typescript
enumArgument({
  description: 'Output format',
  validValues: ['json', 'xml', 'yaml']
})
```

**Parsing rules:**

- Value must be in `validValues` array
- Case-insensitive matching
- Supports partial matching (if unambiguous)

**Examples:**

```bash
my-cli --format json       # format: "json"
my-cli --format JSON       # format: "json"
my-cli --format j          # ❌ Error: not in valid values
my-cli --format invalid    # ❌ Error: not in valid values
```

#### Map Arguments

```typescript
mapArgument({
  description: 'Configuration key-value pairs'
})
```

**Parsing rules:**

- First value is key, remaining are values for that key
- Can appear multiple times with different keys
- Duplicate keys are errors

**Examples:**

```bash
my-cli --config db localhost 5432          # config: { db: ["localhost", "5432"] }
my-cli --config db localhost --config port 3000  # config: { db: ["localhost"], port: ["3000"] }
my-cli --config db host1 --config db host2 # ❌ Error: db is set multiple times
```

### Argument Name Resolution

#### Case Insensitive

```bash
--verbose, --VERBOSE, --Verbose  # All equivalent
```

#### Kebab Case Conversion

```typescript
// Argument defined as 'inputFile'
{
  inputFile: stringArgument({ description: '...' })
}
```

```bash
--input-file value     # Matches 'inputFile'
```

#### Partial Matching

Like subcommands, arguments support partial matching:

```bash
# Given arguments: ['verbose', 'version', 'validate']
--ver          # ❌ Error: ambiguous (verbose, version)
--verb         # ✅ Matches 'verbose'
--vers         # ✅ Matches 'version'
--val          # ✅ Matches 'validate'
```

## Operand Parsing

Operands are positional arguments that come after all named arguments.

### Automatic Detection

```bash
my-cli --verbose file1.txt file2.txt
# If verbose is boolean: operands = ["file1.txt", "file2.txt"]
```

### Explicit Separation

Use `--` to explicitly separate arguments from operands:

```bash
my-cli --files a.txt b.txt -- c.txt d.txt
# files = ["a.txt", "b.txt"]
# operands = ["c.txt", "d.txt"]
```

### Parsing Rules

1. **After boolean args**: Everything after boolean is operands
2. **After single value**: Everything except the value is operands
3. **After array args**: Use `--` or next argument
4. **With `--`**: Everything after `--` is operands

## Best Practices

1. **Use clear argument names** - Avoid abbreviations that could be ambiguous
2. **Provide good error messages** - Custom validators should give helpful feedback
3. **Document expected formats** - Especially for complex argument types
4. **Use `--` when needed** - For operands that might look like arguments
5. **Test edge cases** - Empty values, special characters, etc.
6. **Consider partial matching** - Ensure your argument names don't create ambiguity

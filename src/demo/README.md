# Demos

These are different demos that show how to use the library. They are not included in the packaged library.

## Available Demos

- **[basic.ts](basic.ts)** - Minimal CLI setup with version handling
- **[arguments.ts](arguments.ts)** - All argument types including custom date arguments
- **[operands.ts](operands.ts)** - Working with positional arguments (operands)
- **[noOperands.ts](noOperands.ts)** - CLIs that only accept flags and options (expectOperands: false)
- **[subcommands.ts](subcommands.ts)** - CLI with multiple subcommands and arguments
- **[version.ts](version.ts)** - Version checking and update notifications
- **[stdin.ts](stdin.ts)** - Processing input from stdin
- **[readRelative.ts](readRelative.ts)** - Reading files relative to the script

## Key Concepts Demonstrated

### Operands Handling

- **operands.ts**: Shows how operands work by default (expectOperands: true)
- **noOperands.ts**: Shows type-safe prevention of operands (expectOperands: false)

### Type Safety

- How TypeScript prevents accessing `operands` when `expectOperands: false`
- Compile-time vs runtime validation

Older demos are in the `archive` directory.

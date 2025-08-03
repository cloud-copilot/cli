# Built-in Argument Types

The library provides several built-in argument types that handle validation, parsing, and type safety.

Default values for arguments are optional.

```typescript
import {
  stringArgument,
  stringArrayArgument,
  numberArgument,
  numberArrayArgument,
  booleanArgument,
  enumArgument,
  enumArrayArgument,
  mapArgument
} from '@cloud-copilot/cli'

// String arguments
stringArgument({
  description: 'A single string value',
  defaultValue: 'optional default'
})

stringArrayArgument({
  description: 'Multiple string values',
  defaultValue: ['optional', 'defaults']
})
// Usage, both of these will have the same result:
// --files file1.txt file2.txt file3.txt
// --files file1.txt file2.txt --files file3.txt
// Result: ['file1.txt', 'file2.txt', 'file3.txt']

// Number arguments
numberArgument({
  description: 'A single number',
  defaultValue: 42
})

numberArrayArgument({
  description: 'Multiple numbers',
  defaultValue: []
})

// Boolean flags always default to false and are set to true if specified on the command line
booleanArgument({
  description: 'A boolean flag',
  character: 'v' // Single character alias like -v
})

// Enum arguments
// Return type is a union of the valid values
// If defaultValue is provided return type is a union of valid values and the default value
enumArgument({
  description: 'Choose from specific values',
  validValues: ['option1', 'option2', 'option3'],
  defaultValue: 'option1'
})

enumArrayArgument({
  description: 'Multiple enum values',
  validValues: ['red', 'green', 'blue'],
  defaultValue: ['red']
})

// Map arguments (key-value pairs)
mapArgument({
  description: 'Key-value mappings',
  defaultValue: {}
})
// Usage: --config key1 value1 value2 --config key2 value3
// Result: { key1: ['value1', 'value2'], key2: ['value3'] }
```

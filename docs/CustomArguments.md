# Custom Argument Types

You can create custom argument types with simple validation logic or complex behavior by implementing the `Argument<T>` interface.

## Simple Single and Multiple Value Arguments

```typescript
import { singleValueArgument, arrayValueArgument } from '@cloud-copilot/cli'

// Custom Date argument
const dateArgument = singleValueArgument<Date>((rawValue) => {
  const date = new Date(rawValue)
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format' }
  }
  return { valid: true, value: date }
})

// Custom URL validation
const urlArgument = singleValueArgument<URL>((rawValue) => {
  try {
    const url = new URL(rawValue)
    return { valid: true, value: url }
  } catch {
    return { valid: false, message: 'Invalid URL format' }
  }
})

// Take an array of custom validated IP addresses
// The callback is used to validate each individual value
const ipAddressArrayArgument = arrayValueArgument<string>((rawValue) => {
  const parts = rawValue.split('.')
  if (
    parts.length !== 4 ||
    parts.some((part) => isNaN(Number(part)) || Number(part) < 0 || Number(part) > 255)
  ) {
    return { valid: false, message: `Invalid IP address: ${rawValue}` }
  }
  return { valid: true, value: rawValue }
})

// Use in your CLI
const cli = await parseCliArguments(
  'my-app',
  {},
  {
    startDate: dateArgument({
      description: 'Start date for processing'
    }),
    endpoint: urlArgument({
      description: 'API endpoint URL'
    }),
    ipAddresses: ipAddressArrayArgument({
      description: 'List of IP addresses to process'
    })
  }
)
```

```typescript
// Email validation
const emailArgument = singleValueArgument<string>((value) => {
  if (!value.split('@').length !== 2) {
    return { valid: false, message: 'Invalid email format' }
  }
  return { valid: true, value }
})

// File path validation
const fileArgument = singleValueArgument<string>((value) => {
  if (!require('fs').existsSync(value)) {
    return { valid: false, message: 'File does not exist' }
  }
  return { valid: true, value }
})

const cli = await parseCliArguments(
  'email-tool',
  {},
  {
    to: emailArgument({
      description: 'Recipient email address'
    }),
    attachment: fileArgument({
      description: 'File to attach'
    })
  }
)
```

## Complex Argument Types

You can also create complex argument types that handle sophisticated scenarios by implementing the full `Argument<T>` interface directly. This gives you complete control over validation, value accumulation, and behavior.

### Understanding the Argument Interface

The `Argument<T>` interface has several key functions:

- **`validateValues`**: Validates each set of values when the argument appears
- **`reduceValues`**: Combines the current accumulated value with new validated values
- **`present`** (optional): Called when the argument appears
- **`acceptMultipleValues`** (optional): Determines if the argument accepts multiple values per occurrence

### The `reduceValues` Function

The `reduceValues` function is crucial for handling arguments that appear multiple times. It defines how new values should be combined with existing ones:

```typescript
reduceValues: (currentValue: ArgumentType, newValues: NonNullable<ArgumentType>) =>
  Promise<ArgumentType> | ArgumentType
```

**Examples of different reduce strategies:**

```typescript
// Single value (replace): --config file1.json --config file2.json → file2.json
reduceValues: async (current, newValue) => newValue

// Array (append): --include *.js --include *.ts → ['*.js', '*.ts']
reduceValues: async (current, newValues) => {
  if (!current) return newValues
  current.push(...newValues)
  return current
}

// Map (merge): --env KEY1 val1 --env KEY2 val2 → {KEY1: 'val1', KEY2: 'val2'}
reduceValues: async (current, newValue) => {
  if (!current) return { ...newValue }
  return { ...current, ...newValue }
}

// Set (unique): --tag tag1 --tag tag1 --tag tag2 → Set(['tag1', 'tag2'])
reduceValues: async (current, newValues) => {
  if (!current) return new Set(newValues)
  newValues.forEach((val) => current.add(val))
  return current
}
```

### Example: Configuration Argument

Here's a complex example that parses key-value pairs and validates them:

```typescript
type ConfigMap = Record<string, string>

const configArgument = (options: {
  description: string
  defaultValue?: ConfigMap
}): Argument<ConfigMap | undefined> => ({
  description: options.description + '. Format: KEY=VALUE',
  defaultValue: options.defaultValue,

  validateValues: async (current, values) => {
    if (values.length === 0) {
      return { valid: false, message: 'at least one KEY=VALUE pair required' }
    }

    const config: ConfigMap = {}
    for (const value of values) {
      const [key, ...valueParts] = value.split('=')
      if (!key || valueParts.length === 0) {
        return { valid: false, message: `invalid format "${value}", expected KEY=VALUE` }
      }

      const configValue = valueParts.join('=') // Handle values with = in them
      if (current && key in current) {
        return { valid: false, message: `duplicate key "${key}"` }
      }

      config[key] = configValue
    }

    return { valid: true, value: config }
  },

  reduceValues: async (current, newConfig) => {
    if (!current) return newConfig
    return { ...current, ...newConfig }
  },

  acceptMultipleValues: () => true
})

// Usage: --config DB_HOST=localhost --config DB_PORT=5432 --config API_KEY=secret123
```

### Example: Weighted Items Argument

An argument that accumulates items with weights, useful for priority systems:

```typescript
type WeightedItem = { name: string; weight: number }
type WeightedItems = WeightedItem[]

const weightedItemsArgument = (options: {
  description: string
  defaultValue?: WeightedItems
}): Argument<WeightedItems | undefined> => ({
  description: options.description + '. Format: ITEM:WEIGHT',
  defaultValue: options.defaultValue,

  validateValues: async (current, values) => {
    if (values.length === 0) {
      return { valid: false, message: 'at least one ITEM:WEIGHT required' }
    }

    const items: WeightedItems = []
    for (const value of values) {
      const [name, weightStr] = value.split(':')
      if (!name || !weightStr) {
        return { valid: false, message: `invalid format "${value}", expected ITEM:WEIGHT` }
      }

      const weight = parseFloat(weightStr)
      if (isNaN(weight) || weight <= 0) {
        return { valid: false, message: `weight must be a positive number, got "${weightStr}"` }
      }

      // Check for duplicates in this batch
      if (items.some((item) => item.name === name)) {
        return { valid: false, message: `duplicate item "${name}" in same argument` }
      }

      items.push({ name, weight })
    }

    return { valid: true, value: items }
  },

  reduceValues: async (current, newItems) => {
    if (!current) return newItems

    // Merge items, updating weights for existing items
    const merged = [...current]
    for (const newItem of newItems) {
      const existingIndex = merged.findIndex((item) => item.name === newItem.name)
      if (existingIndex >= 0) {
        merged[existingIndex].weight = newItem.weight // Update weight
      } else {
        merged.push(newItem) // Add new item
      }
    }

    return merged
  },

  acceptMultipleValues: () => true
})

// Usage: --priority task1:10 task2:5 --priority task3:8 --priority task1:15
// Result: [{ name: 'task1', weight: 15 }, { name: 'task2', weight: 5 }, { name: 'task3', weight: 8 }]
```

### Example: Accumulating Statistics Argument

An argument that builds up statistical data over multiple invocations:

```typescript
type StatsData = {
  count: number
  sum: number
  values: number[]
}

const statsArgument = (options: { description: string }): Argument<StatsData | undefined> => ({
  description: options.description + '. Accumulates numerical data for statistics',
  defaultValue: undefined,

  validateValues: async (current, values) => {
    if (values.length === 0) {
      return { valid: false, message: 'at least one number required' }
    }

    const numbers: number[] = []
    for (const value of values) {
      const num = parseFloat(value)
      if (isNaN(num)) {
        return { valid: false, message: `"${value}" is not a valid number` }
      }
      numbers.push(num)
    }

    const stats: StatsData = {
      count: numbers.length,
      sum: numbers.reduce((a, b) => a + b, 0),
      values: numbers
    }

    return { valid: true, value: stats }
  },

  reduceValues: async (current, newStats) => {
    if (!current) return newStats

    return {
      count: current.count + newStats.count,
      sum: current.sum + newStats.sum,
      values: [...current.values, ...newStats.values]
    }
  },

  acceptMultipleValues: () => true
})

// Usage: --data 1.5 2.3 4.1 --data 3.7 5.2
// Result: { count: 5, sum: 17.8, values: [1.5, 2.3, 4.1, 3.7, 5.2] }
```

### Example: File Aggregation with Validation

An argument that collects file paths and validates they exist:

```typescript
import * as fs from 'fs'

type FileInfo = {
  path: string
  size: number
  exists: boolean
}

const fileListArgument = (options: {
  description: string
  validateExists?: boolean
}): Argument<FileInfo[]> => ({
  description: options.description + '. Collects file paths with metadata',
  defaultValue: [],

  validateValues: async (current, values) => {
    if (values.length === 0) {
      return { valid: false, message: 'at least one file path required' }
    }

    const files: FileInfo[] = []
    for (const path of values) {
      try {
        const stats = fs.statSync(path)
        files.push({
          path,
          size: stats.size,
          exists: true
        })
      } catch (error) {
        if (options.validateExists) {
          return { valid: false, message: `file "${path}" does not exist` }
        }
        files.push({
          path,
          size: 0,
          exists: false
        })
      }
    }

    return { valid: true, value: files }
  },

  reduceValues: async (current, newFiles) => {
    const combined = [...current]

    // Check for duplicates and merge
    for (const newFile of newFiles) {
      const existingIndex = combined.findIndex((f) => f.path === newFile.path)
      if (existingIndex >= 0) {
        combined[existingIndex] = newFile // Update with latest info
      } else {
        combined.push(newFile)
      }
    }

    return combined
  },

  acceptMultipleValues: () => true
})
```

### Key Patterns for `reduceValues`

1. **Replace Strategy** (single values): Always return the new value
2. **Append Strategy** (arrays): Add new items to existing collection
3. **Merge Strategy** (objects): Combine properties, with new values taking precedence
4. **Update Strategy**: Update existing items based on some key, add new ones
5. **Aggregate Strategy**: Combine values mathematically or statistically
6. **Unique Strategy**: Maintain uniqueness while accumulating

### Tips for Complex Arguments

- Use `acceptMultipleValues: () => true` when your argument can accept multiple values
- Validate early in `validateValues` to provide good error messages
- Use `reduceValues` to build up complex state across multiple argument occurrences
- Consider edge cases like empty current values and duplicate handling
- Make validation messages specific and actionable
- Use TypeScript generics to maintain type safety throughout

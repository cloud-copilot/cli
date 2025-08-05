import { booleanArgument } from '../arguments/booleanArgument.js'
import { stringArgument } from '../arguments/stringArguments.js'
import { parseCliArguments } from '../cli.js'

const run = async () => {
  const cli = await parseCliArguments(
    'config-tool',
    {},
    {
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      }),
      config: stringArgument({
        description: 'Configuration file path'
      }),
      validate: booleanArgument({
        description: 'Validate configuration only',
        character: 'c'
      }),
      format: stringArgument({
        description: 'Output format for validation results',
        defaultValue: 'table'
      })
    },
    {
      expectOperands: false // This tool only accepts flags and options, no operands
    }
  )

  // Type checking: cli.operands has type 'never'
  // This means you cannot access cli.operands at compile time!

  // ❌ Example Errors
  cli.operands // Type is 'never'
  const count = cli.operands.length // Error: Property 'length' does not exist on type 'never'
  cli.operands.forEach((op) => console.log(op)) // Error: Property 'forEach' does not exist on type 'never'

  // Normal Code
  console.log('Configuration Tool')
  console.log('Arguments:', cli.args)

  if (cli.args.config) {
    console.log(`Using config file: ${cli.args.config}`)
  } else {
    console.log('No config file specified, using defaults')
  }

  if (cli.args.validate) {
    console.log(`Validation mode enabled (format: ${cli.args.format})`)
  }

  if (cli.args.verbose) {
    console.log('Verbose mode enabled')
    console.log('This tool does not accept operands - only flags and options')
  }
}

run().then(() => {})

/*

=== Examples to try ===

// Valid usage - only flags and options
npx tsx src/demo/noOperands.ts --verbose --config ./config.json
npx tsx src/demo/noOperands.ts -v --validate --format json
npx tsx src/demo/noOperands.ts --config settings.yml -c

// Show help (notice no operands in the usage line)
npx tsx src/demo/noOperands.ts --help

// These will cause runtime errors because operands are not expected:
npx tsx src/demo/noOperands.ts --verbose file.txt                   # Error because flags can't accept values
npx tsx src/demo/noOperands.ts --config config.json some-file.txt   # Error because --config expects a single value
npx tsx src/demo/noOperands.ts extra arguments                      # Error because operands are not allowed
npx tsx src/demo/noOperands.ts -- file.txt                          # Error because explicit operands are not allowed, even using `--`

=== Key Points ===

- expectOperands `false` means everything must be a flag or argument
- cli.operands has type 'never' - you cannot access it at compile time
- The CLI will exit with a clear error if operands are provided at runtime
- The help message does not show operands in the usage line
- Perfect for tools that only work with flags and options (like config tools, status checkers, etc.)
*/

import { booleanArgument } from '../arguments/booleanArgument.js'
import { stringArgument } from '../arguments/stringArguments.js'
import { parseCliArguments } from '../cli.js'

const run = async () => {
  const cli = await parseCliArguments(
    'file-processor',
    {},
    {
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      }),
      output: stringArgument({
        description: 'Output directory'
      }),
      format: stringArgument({
        description: 'Output format',
        defaultValue: 'json'
      })
    }
    // expectOperands defaults to true, so operands are expected and allowed
  )

  // Type checking: cli.operands is string[]
  console.log('Arguments:', cli.args)
  console.log('Input files (operands):', cli.operands)
  console.log('Number of files to process:', cli.operands.length)

  // You can safely iterate over operands
  if (cli.operands.length > 0) {
    console.log('\nProcessing files:')
    cli.operands.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`)
    })
  } else {
    console.log('No input files provided')
  }

  if (cli.args.verbose) {
    console.log('\nVerbose mode enabled')
    console.log('Output directory:', cli.args.output || 'current directory')
    console.log('Format:', cli.args.format)
  }
}

run().then(() => {})

/*

=== Examples to try ===

// Basic usage with operands (file names)
npx tsx src/demo/operands.ts file1.txt file2.txt file3.txt

// With flags and operands
npx tsx src/demo/operands.ts --verbose --output ./dist file1.txt file2.txt

// Using short flags
npx tsx src/demo/operands.ts -v --format xml document.txt

// Using the -- separator to clearly separate options from operands
npx tsx src/demo/operands.ts --verbose --output ./build -- file1.txt file2.txt --not-a-flag.txt

// Show help (notice operands are mentioned in the usage)
npx tsx src/demo/operands.ts --help

// No operands is fine too (default behavior allows it)
npx tsx src/demo/operands.ts --verbose --format csv

=== Key Points ===

- Operands are accepted by default
- cli.operands has type string[] - fully accessible
- You can process operands normally with array methods
- The help message shows operands in the usage line
*/

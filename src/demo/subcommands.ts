import { booleanArgument } from '../arguments/booleanArgument.js'
import { stringArgument } from '../arguments/stringArguments.js'
import { parseCliArguments } from '../cli.js'

const run = async () => {
  const cli = await parseCliArguments(
    'src/demo/subcommands.ts',
    {
      init: {
        description: 'Initialize the app',
        arguments: {}
      },
      download: {
        description: 'Download data',
        arguments: {
          insecure: booleanArgument({
            description: 'Disable security',
            character: 'i'
          }),
          endpoint: stringArgument({
            description: 'Download from a specific endpoint'
          })
        }
      },
      clean: {
        description: 'Cleanup data',
        arguments: {}
      }
    },
    {
      verbose: booleanArgument({
        description: 'Show verbose logging',
        character: 'v'
      })
    },
    {
      // requireSubcommand: true,
      version: '1.0.0'
    }
  )

  console.log(cli)

  const verbose = cli.args.verbose

  cli.args.endpoint // compile error

  if (cli.subcommand == 'download') {
    const endpoint: string | undefined = cli.args.endpoint
  }
}

run().then(() => {})

/*

// Subcommand help
npx tsx src/demo/subcommands.ts --help

// Subcommand specific help
npx tsx src/demo/subcommands.ts download --help

// Subcommand specific arguments
npx tsx src/demo/subcommands.ts download --endpoint https://example.com

//Argument with wrong subcommand
npx tsx src/demo/subcommands.ts init --endpoint https://example.com

*/

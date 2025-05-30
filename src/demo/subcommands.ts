import { parseCliArguments } from '../cli.js'

const cli = parseCliArguments(
  'src/demo/subcommands.ts',
  {
    init: {
      description: 'Initialize the app',
      options: {}
    },
    download: {
      description: 'Download data',
      options: {
        insecure: {
          type: 'boolean',
          character: 'i',
          description: 'Disable security'
        },
        endpoint: {
          type: 'string',
          values: 'single',
          description: 'Download from a specific endpoint'
        }
      }
    },
    clean: {
      description: 'Cleanup data',
      options: {}
    }
  },
  {
    verbose: {
      type: 'boolean',
      character: 'v',
      description: 'Show verbose logging'
    }
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

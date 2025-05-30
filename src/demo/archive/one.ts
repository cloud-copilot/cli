import { parseCliArguments } from '../../cli.js'

/*

  npx tsx src/demo/archive/one.ts

*/

const cli = parseCliArguments(
  'one',
  {
    init: {
      description: 'Initialize the project',
      options: {
        s3: {
          description: 'Use S3 as the storage',
          character: 's',
          type: 'boolean'
        },
        language: {
          description: 'The language to use',
          values: 'single',
          type: 'enum',
          validValues: ['typescript', 'javascript']
        }
      }
    },
    download: {
      description: 'Download a file',
      options: {
        url: {
          description: 'The URL to download from',
          values: 'single',
          type: 'string'
        }
      }
    }
  },
  {
    verbose: {
      description: 'Print more information',
      character: 'v',
      type: 'boolean'
    }
  },
  {
    showHelpIfNoArgs: true,
    version: '1.0.0',
    expectOperands: false,
    requireSubcommand: false
  }
)

console.log(JSON.stringify(cli, null, 2))

if (cli.subcommand === 'init') {
  console.log(cli.args.s3)
}

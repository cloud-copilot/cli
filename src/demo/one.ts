import { parseCliArguments } from '../cli.js'

/*

  npx tsx src/demo/one.ts

*/

const args = parseCliArguments(
  'one',
  {
    init: {
      description: 'Initialize the project',
      options: {
        s3: {
          description: 'Use S3 as the storage',
          character: 's',
          values: 'none'
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
      values: 'none'
    }
  },
  {
    showHelpIfNoArgs: true,
    version: '1.0.0',
    expectOperands: false
  }
)

console.log(JSON.stringify(args, null, 2))

if (args.command === 'init') {
  console.log(args.args.s3)
}

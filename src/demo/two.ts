import { parseCliArguments } from '../cli.js'

/*

  npx tsx src/demo/two.ts

*/

const args = parseCliArguments(
  'one',
  {},
  {
    verbose: {
      description: 'Print more information',
      character: 'v',
      values: 'none'
    }
  },
  {
    showHelpIfNoArgs: true,
    version: '1.0.0'
  }
)

console.log(JSON.stringify(args, null, 2))

console.log(args.args.verbose)
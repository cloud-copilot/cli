import { parseCliArguments } from '../cli.js'

/*

  npx tsx src/demo/two.ts

*/

const cli = parseCliArguments(
  'two',
  {},
  {
    verbose: {
      description: 'Print more information',
      character: 'v',
      type: 'boolean'
    }
  },
  {
    version: '1.0.0'
  }
)

console.log(JSON.stringify(cli, null, 2))

console.log(cli.args.verbose)

cli.printHelp()

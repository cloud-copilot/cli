import { parseCliArguments } from '../cli.js'

/*

  npx tsx src/demo/four.ts

*/

const cli = parseCliArguments(
  'four',
  {},
  {
    verbose: {
      description: 'Print more information',
      character: 'v',
      type: 'boolean'
    },
    type: {
      description: 'Type of the file',
      type: 'enum',
      validValues: ['json', 'yaml', 'xml'],
      values: 'single'
    },
    formats: {
      description: 'Type of the file',
      type: 'enum',
      validValues: ['gif', 'jpg', 'png', 'svg'],
      values: 'multiple'
    }
  },
  {
    showHelpIfNoArgs: true,
    version: '1.0.0',
    operandsName: 'op'
  }
)

console.log(JSON.stringify(cli, null, 2))

console.log(cli.args.verbose)
console.log(cli.args.type)
console.log(cli.args.formats)

import { parseCliArguments } from '../../cli.js'

/*

  npx tsx src/demo/archive/three.ts

*/

const cli = parseCliArguments(
  'three',
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
      description: 'Image types',
      type: 'enum',
      validValues: ['gif', 'jpg', 'png', 'svg'],
      values: 'multiple'
    }
  },
  {
    showHelpIfNoArgs: true,
    version: '1.0.0'
  }
)

console.log(JSON.stringify(cli, null, 2))

console.log(cli.args.verbose)
console.log(cli.args.type)
console.log(cli.args.formats)

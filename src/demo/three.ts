import { parseCliArguments } from '../cli.js'

/*

  npx tsx src/demo/three.ts

*/

const args = parseCliArguments(
  'three',
  {},
  {
    verbose: {
      description: 'Print more information',
      character: 'v',
      values: 'none'
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
    version: '1.0.0'
  }
)

console.log(JSON.stringify(args, null, 2))

console.log(args.args.verbose)
console.log(args.args.type)
console.log(args.args.formats)

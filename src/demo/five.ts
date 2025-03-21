import { parseCliArguments } from '../cli.js'
import { readStdin } from '../stdin.js'

/*

  npx tsx src/demo/five.ts

*/

async function run() {
  const cli = parseCliArguments(
    'five',
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
      },
      readWait: {
        description: 'The time to wait for input from stdin',
        type: 'number',
        values: 'single'
      }
    },
    {
      version: '1.0.0'
    }
  )

  console.log(JSON.stringify(cli, null, 2))
  const stdIn = await readStdin(cli.args.readWait)

  console.log(stdIn)
  console.log(cli.args.verbose)
  console.log(cli.args.type)
  console.log(cli.args.formats)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .then(() => {})
  .finally(() => {})

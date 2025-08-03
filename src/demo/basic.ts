import { parseCliArguments } from '../cli.js'

const run = async () => {
  const cli = await parseCliArguments(
    'src/demo/basic.ts',
    {},
    {},
    {
      version: '1.0.0'
    }
  )

  console.log(cli)
}

run().then(() => {})

/*


// The simplest possible usage
npx tsx src/demo/basic.ts

// Show the help
npx tsx src/demo/basic.ts --help

// Operands
npx tsx src/demo/basic.ts op1 op2 op3

*/

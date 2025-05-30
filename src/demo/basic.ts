import { parseCliArguments } from '../cli.js'

const cli = parseCliArguments('basic.ts', {}, {}, {})

console.log(cli)

/*


// The simplest possible usage
npx tsx src/demo/basic.ts

// Show the help
npx tsx src/demo/basic.ts --help

// Operands
npx tsx src/demo/basic.ts op1 op2 op3

*/

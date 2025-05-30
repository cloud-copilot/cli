import { parseCliArguments } from '../cli.js'

const cli = parseCliArguments('basic.ts', {}, {}, {})

const run = async () => {
  const fromStdin = await readStdin(undefined)
  console.log(`content from stdin: ${fromStdin}`)
}

run().then(() => {})

/*

npx tsx src/demo/stdin.ts

echo "hello" | npx tsx stdin.ts

curl "https://www.random.org/integers/?num=1&min=1&max=100&col=5&base=10&format=plain&rnd=new" | npx tsx src/demo/stdin.ts
*/

import { parseCliArguments } from '../cli.js'
import { readStdin } from '../stdin.js'

const run = async () => {
  const cli = await parseCliArguments('src/demo/stdin.ts', {}, {}, {})
  const fromStdin = await readStdin(undefined)
  console.log(`content from stdin: ${fromStdin}`)
}

run().then(() => {})

/*

npx tsx src/demo/stdin.ts

echo "hello" | npx tsx src/demo/stdin.ts

curl "https://www.random.org/integers/?num=1&min=1&max=100&col=5&base=10&format=plain&rnd=new" | npx tsx src/demo/stdin.ts
*/

import { parseCliArguments } from '../cli.js'
import { readRelativeFile } from '../readRelative.js'

const cli = parseCliArguments('basic.ts', {}, {}, {})

const run = async () => {
  // Use import.meta.url or __filename
  const start = __filename
  // const start = import.meta.url
  const relativeContents = await readRelativeFile(start, 2, ['src', 'demo', 'README.md'])
  console.log(relativeContents)
}

run().then(() => {})

/*

npx tsx src/demo/readRelative.ts
*/

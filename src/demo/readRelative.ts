import { parseCliArguments } from '../cli.js'
import { createPackageFileReader } from '../readRelative.js'

const run = async () => {
  const cli = await parseCliArguments('basic.ts', {}, {}, {})
  // Use import.meta.url or __filename
  const start = __filename
  // const start = import.meta.url

  //Create a reader that can read files relative to the root of your project
  const relativeFileReader = createPackageFileReader(start, 2)

  // Read the README.md file in the src/demo directory
  const relativeContents = await relativeFileReader.readFile(['src', 'demo', 'README.md'])
  console.log(relativeContents)
}

run().then(() => {})

/*

npx tsx src/demo/readRelative.ts
*/

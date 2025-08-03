import { parseCliArguments } from '../cli.js'

const run = async () => {
  const cli = await parseCliArguments(
    'src/demo/version.ts',
    {},
    {},
    {
      version: {
        currentVersion: '0.1.38',
        checkForUpdates: '@cloud-copilot/cli'
      }
    }
  )

  console.log(cli)
}

run().then(() => {})

/*


// Show the version and check for updates
npx tsx src/demo/version.ts --version

*/

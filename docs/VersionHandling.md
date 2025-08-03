# Version Handling

This guide covers the sophisticated version handling capabilities of `@cloud-copilot/cli`, including automatic update checking and custom version logic.

## Basic Version Information

The simplest way to add version support is with a static string:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: '1.0.0'
  }
)
```

Users can now run:

```bash
my-app --version
# 1.0.0
```

## Dynamic Version from package.json

Load version information from your package.json file:

```typescript
import { createPackageFileReader } from '@cloud-copilot/cli'

//Create a reader that can read files relative to the root of your project
const relativeFileReader = createPackageFileReader(import.meta.url, 2)

// Read the package.json file in your project root
const contents = await relativeFileReader.readFile(['package.json'])
const version = JSON.parse(contents).version

const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: version
  }
)
```

Or use a function for lazy loading:

```typescript
import { createPackageFileReader } from '@cloud-copilot/cli'



const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: () => {
        //Create a reader that can read files relative to the root of your project
        const relativeFileReader = createPackageFileReader(import.meta.url, 2)

        // Read the package.json file in your project root
        const contents = await relativeFileReader.readFile(['package.json'])
        const version = return JSON.parse(contents).version
      }
    }
  }
)
```

## Automatic Update Checking

Enable automatic update checking by specifying an npm package name:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: '1.0.0',
      checkForUpdates: '@my-org/my-package' // npm package name
    }
  }
)
```

When users run `--version`, the CLI will:

1. Display the current version
2. Check npm for the latest published version
3. Show an update message if a newer version is available

### Example Output

```bash
my-app --version
# Output:
# my-app version 1.0.0
#
# Update available: 1.0.0 → 1.2.3
# Run: npm install -g my-npm-package
```

## Custom Update Messages

Customize the update notification message:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: '1.0.0',
      checkForUpdates: 'my-npm-package',
      updateMessage: (current, latest) =>
        `🎉 New version available!\n` +
        `Current: ${current}\n` +
        `Latest: ${latest}\n` +
        `\n` +
        `Update with: npm install -g my-npm-package@${latest}\n` +
        `Changelog: https://github.com/my-org/my-package/releases/tag/v${latest}`
    }
  }
)
```

## Custom Update Check Logic

Implement your own update checking logic:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: '1.0.0',
      checkForUpdates: async () => {
        try {
          const response = await fetch(
            'https://api.github.com/repos/my-org/my-repo/releases/latest'
          )
          const data = await response.json()
          return data.tag_name.replace(/^v/, '') // Remove 'v' prefix
        } catch (error) {
          console.warn('Failed to check for updates:', error.message)
          return null // Return null to indicate no update available
        }
      },
      updateMessage: (current, latest) =>
        `Update available: ${current} → ${latest}\n` +
        `Download: https://github.com/my-org/my-repo/releases/tag/v${latest}`
    }
  }
)
```

## Async Version Functions

Both `currentVersion` and `checkForUpdates` can be async functions:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: async () => {
        // Maybe read from a database, API, or computed value
        const buildInfo = await fetch('https://api.example.com/build-info')
        const data = await buildInfo.json()
        return `${data.version}-${data.buildNumber}`
      },
      checkForUpdates: async () => {
        // Custom update check logic
        const response = await fetch('https://api.example.com/latest-version')
        const data = await response.json()
        return data.version
      }
    }
  }
)
```

## Advanced Version Patterns

### Semantic Version Comparison

```typescript
import semver from 'semver'

const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: '1.2.0',
      checkForUpdates: async () => {
        const response = await fetch('https://registry.npmjs.org/my-package/latest')
        const data = await response.json()
        return data.version
      },
      updateMessage: (current, latest) => {
        const updateType = semver.diff(current, latest)
        const urgency =
          updateType === 'major' ? '⚠️  MAJOR' : updateType === 'minor' ? '✨ MINOR' : '🐛 PATCH'

        return (
          `${urgency} update available: ${current} → ${latest}\n` +
          `Run: npm install -g my-package@${latest}`
        )
      }
    }
  }
)
```

### Development vs Production Versioning

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: () => {
        const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
        if (isDevelopment) {
          const gitHash = require('child_process')
            .execSync('git rev-parse --short HEAD')
            .toString()
            .trim()
          return `${pkg.version}-dev-${gitHash}`
        }
        return pkg.version
      },
      // Only check for updates in production
      checkForUpdates: isDevelopment ? undefined : 'my-npm-package'
    }
  }
)
```

### Build Information

Include build information in version output:

```typescript
const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: () => {
        const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
        const buildDate = new Date().toISOString()
        const nodeVersion = process.version

        return [
          `Version: ${pkg.version}`,
          `Built: ${buildDate}`,
          `Node: ${nodeVersion}`,
          `Platform: ${process.platform}-${process.arch}`
        ].join('\n')
      }
    }
  }
)
```

### Update Channels

Support different update channels (stable, beta, nightly):

```typescript
const updateChannel = process.env.UPDATE_CHANNEL || 'stable'

const cli = await parseCliArguments(
  'my-app',
  {},
  {},
  {
    version: {
      currentVersion: '1.0.0',
      checkForUpdates: async () => {
        const response = await fetch(`https://api.example.com/releases/${updateChannel}`)
        const data = await response.json()
        return data.version
      },
      updateMessage: (current, latest) =>
        `Update available on ${updateChannel} channel: ${current} → ${latest}\n` +
        `Run: npm install -g my-package@${updateChannel}`
    }
  }
)
```

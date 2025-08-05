# CLI

[![NPM Version](https://img.shields.io/npm/v/@cloud-copilot/cli.svg?logo=nodedotjs)](https://www.npmjs.com/package/@cloud-copilot/cli) [![MIT License](https://img.shields.io/github/license/cloud-copilot/cli)](LICENSE.txt)

[![GuardDog](https://github.com/cloud-copilot/cli/actions/workflows/guarddog.yml/badge.svg)](https://github.com/cloud-copilot/cli/actions/workflows/guarddog.yml) [![Known Vulnerabilities](https://snyk.io/test/github/cloud-copilot/cli/badge.svg?targetFile=package.json&style=flat-square)](https://snyk.io/test/github/cloud-copilot/cli?targetFile=package.json)

Utilities for standardizing working CLIs in Typescript.

- Standardizes the way subcommands, arguments, and operands are parsed and validated
- Includes "prefix matching" of subcommands and arguments, so users can provide partial names if they match only one subcommand or argument
- Allows users to default arguments with environment variables
- Automatically generates a help text for the user
- Provides a type safe response of the parsed arguments
- Has zero dependencies
- Built-in argument types for string, number, boolean, enum, array, and map types
- Easy custom argument types to create your own argument types with validation
- Async argument validation and version checking
- Automatic version checking for updates to your CLI

I wrote this because I'm building several CLI applications and want to have a standard parsing of arguments that users can rely on across all of them.

I was inspired by https://github.com/lirantal/nodejs-cli-apps-best-practices and https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html to follow best practices for accepting arguments and environment variables while keeping my scope extremely limited and having no dependencies.

## Table of Contents

- [Example](#example)
- [Installation](#installation)
- [Documentation](#documentation)
  - [Core Guides](#core-guides)
  - [Examples](#examples)

## Documentation

### Core Guides

- **[Getting Started](docs/GettingStarted.md)** - Complete tutorial for new users
- **[Parsing Reference](docs/ParsingReference.md)** - Detailed parsing rules and mechanics
- **[Operands Guide](docs/OperandsGuide.md)** - Working with positional arguments and expectOperands
- **[Subcommands Guide](docs/SubcommandsGuide.md)** - Building CLIs with subcommands
- **[Custom Arguments](docs/CustomArguments.md)** - Creating custom argument types with validation
- **[Environment Variables](docs/EnvironmentVariables.md)** - Environment variable integration
- **[Version Handling](docs/VersionHandling.md)** - Version management and update checking
- **[API Reference](docs/APIReference.md)** - API documentation

### [Examples](src/demo/README.md)

- **[Basic CLI](src/demo/basic.ts)** - Minimal CLI setup with version handling
- **[Arguments Demo](src/demo/arguments.ts)** - All argument types including custom date arguments
- **[Operands Demo](src/demo/operands.ts)** - Working with positional arguments (operands)
- **[No Operands Demo](src/demo/noOperands.ts)** - CLIs that only accept flags and options
- **[Subcommands Demo](src/demo/subcommands.ts)** - CLI with multiple subcommands and arguments
- **[Version Handling](src/demo/version.ts)** - Version checking and update notifications
- **[Reading from stdin](src/demo/stdin.ts)** - Processing input from stdin

## Example

```typescript
import {
  parseCliArguments,
  stringArgument,
  stringArrayArgument,
  booleanArgument,
  numberArgument,
  enumArgument
} from '@cloud-copilot/cli'

const cli = await parseCliArguments(
  'my-command',
  // optional subcommands
  {
    init: {
      description: 'Initialize the project',
      // Subcommand Specific Arguments
      arguments: {
        s3: booleanArgument({
          description: 'Use S3 as the storage',
          character: 's'
        }),
        language: enumArgument({
          description: 'The language to use',
          validValues: ['typescript', 'javascript']
        })
      }
    },
    download: {
      description: 'Download a file',
      // Subcommand Specific Arguments
      arguments: {
        url: stringArgument({
          description: 'The URL to download from'
        })
      }
    }
  },
  // Global Arguments that apply to all subcommands
  {
    regions: stringArrayArgument({
      description: 'Regions to deploy to'
    }),
    account: stringArgument({
      description: 'AWS account to deploy to'
    }),
    ssl: booleanArgument({
      description: 'Enable SSL',
      character: 's'
    }),
    port: numberArgument({
      description: 'Port to use'
    })
  },
  {}
)
```

This will automatically pull in the arguments from the command line and validate them. If any arguments are not valid, it will throw an error with the message of what is wrong. If all arguments and subcommands are valid, it will return an object with a type safe response.

```typescript
cli.subcommand // 'init' | 'download' | undefined
cli.args.regions // string[] | undefined
cli.args.account // string | undefined
cli.args.ssl // boolean
cli.args.port // number | undefined

cli.anyValues // boolean, whether any values were provided on the CLI

if (cli.subcommand === 'init') {
  // Type Checked command specific arguments only in the return type if the subcommand is selected
  cli.args.s3 // boolean
  cli.args.language // 'typescript' | 'javascript' | undefined
}

if (cli.subcommand === 'download') {
  cli.args.url // string | undefined
}
```

If the user provides `--help` a help message will be printed out with the available subcommands and arguments.

## Installation

```bash
npm install @cloud-copilot/cli
```

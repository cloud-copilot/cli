# CLI

[![NPM Version](https://img.shields.io/npm/v/@cloud-copilot/cli.svg?logo=nodedotjs)](https://www.npmjs.com/package/@cloud-copilot/cli) [![MIT License](https://img.shields.io/github/license/cloud-copilot/cli)](LICENSE.txt)

[![GuardDog](https://github.com/cloud-copilot/cli/actions/workflows/guarddog.yml/badge.svg)](https://github.com/cloud-copilot/cli/actions/workflows/guarddog.yml) [![Known Vulnerabilities](https://snyk.io/test/github/cloud-copilot/cli/badge.svg?targetFile=package.json&style=flat-square)](https://snyk.io/test/github/cloud-copilot/cli?targetFile=package.json)

Utilities for standardizing working CLIs in Typescript.

- Standardizes the way subcommands, arguments, and operands are parsed and validated
- Includes "fuzzy matching" of subcommands and arguments, so users can provide partial names if they match only one subcommand or argument
- Allows users to default arguments with environment variables
- Automatically generates a help text for the user
- Provides a type safe response of the parsed arguments
- Has zero dependencies

I wrote this because I'm building several CLI applications and want to have a standard parsing of arguments that users can rely on across all of them.

I was inspired by https://github.com/lirantal/nodejs-cli-apps-best-practices and https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html to follow best practices for accepting arguments and environment variables while keeping my scope extremely limited and having no dependencies.

## Example

```typescript
import {parseCliArguments} from '@cloud-copilot/cli';

const parsedArguments = const parsed2 = parseArguments(
  'my-command',
  // optional subcommands
  init: {
    description: 'Initialize the project',
    // Subcommand Specific Arguments
    options: {
      s3: {
        description: 'Use S3 as the storage',
        character: 's',
        values: 'none'
      },
      language: {
        description: 'The language to use',
        values: 'single',
        type: 'enum',
        validValues: ['typescript', 'javascript']
      }
    }
  },
  download: {
    description: 'Download a file',
    // Subcommand Specific Arguments
    options: {
      url: {
        description: 'The URL to download from',
        values: 'single',
        type: 'string'
      }
    }
  },
  // Global Arguments
  {
    regions: { type: 'string', values: 'multiple', description: 'Regions to deploy to' },
    account: { type: 'string', values: 'single', description: 'AWS account to deploy to' },
    ssl: { values: 'none', description: 'Enable SSL', character: 's', default: false },
    port: { type: 'number', values: 'single', description: 'Port to use' },
    points: { type: 'number', values: 'multiple', description: 'Data points' }
  },
  {}
)
```

This will automatically pull in the arguments from the command line and validate them. If any arguments are not valid, it will throw an error with the message of what is wrong. If all arguments and subcommands are valid, it will return an object with a type safe response.

```typescript
parsedArguments.command // string | undefined
parsedArguments.args.regions // string[]
parsedArguments.args.account // string | undefined
parsedArguments.args.ssl // boolean
parsedArguments.args.port // number | undefined
parsedArguments.args.points // number[]

parsedArguments.anyValues // boolean, whether any values were provided on the CLI

if (parsedArguments.command === 'init') {
  // Type Checked command specific arguments
  parsedArguments.args.s3 // boolean
}
```

If the user provides `--help` a help message will be printed out with the available subcommands and arguments.

## Installation

```bash
npm install @cloud-copilot/cli
```

## Parsing CLI Input

Arguments are parsed into three things:

```bash
my-command [subcommand] [arguments] [--] [operands]
```

- The subcommand which is the first argument and is optional based on your configuration
- The arguments that start with `--` (or optionally `-` for boolean flags) in the CLI
- The operands, which are the remaining values after the arguments. If provided, all arguments after the literal `  --  ` are considered operands.

### Parsing subcommands

If you provide a list of subcommands, the first argument will be parsed as a subcommand if it does not start with a `-`. If the subcommand is not provided, it will be `undefined`.

Partial matching will be used. If only one subcommand matches the string from the user input, the subcommand it matches will be returned. If more than one subcommand matches, an error will be thrown. If the string provided does not match any subcommand, an error will be thrown.

### Parsing Arguments

Arguments are parsed from the CLI input. They are generally parsed as `--name value` or `--name value1 value2 value3`. If the argument is a boolean flag, it can be provided as `--name` or `-n`. Arguments are case insensitive.

#### Boolean Arguments

Boolean values can be provided as `--name` or `-n`. If the argument is a boolean, the value will be `true` if the argument is provided and `false` if it is not. If an argument is passed to a boolean argument, an error will be thrown.

Multiple single character boolean flags can be combined into a single argument. For example, `-abc` is equivalent to `-a -b -c`.

#### String or Number Arguments

String or number arguments can be provided as `--name value` or `--name value1 value2 value3`. If the argument is a single value, it will be parsed as a single value. If the argument is multiple values, it will be parsed as an array of strings or numbers.

String or number arguments will throw an error if:

- The flag is specified an no values are provided
- The argument accepts only one value and multiple values are provided
- The argument is a number and a non-number value is provided

#### Enum Arguments

Enum arguments can be provided as `--name value1 value2`. The values must be one of the values provided in the `values` field of the argument configuration. The values are returned as a string or a string array.

Enum arguments will throw an error if:

- The flag is specified an no values are provided
- The argument accepts only one value and multiple values are provided
- Any of the arguments provided are not in the list of allowed values.

If the value is not one of the values provided, an error will be thrown.

If a string or number argument is provided with no values an error will be thrown.

### Operands

Operands are the remaining values after the arguments.
If there are no arguments, all strings after the subcommand (if any) are considered operands.
If the last argument is a boolean all strings after the boolean are considered operands.
If the last argument is a single value all the strings after the value for the argument are considered operands.
If the last argument is multiple values, use `  --  ` to separate the arguments from the operands.

### Environment Variables

If an `environmentPrefix` is specified in `additionalArgs`, the library will look for environment variables that start with the prefix and use them as defaults for the arguments. For example, if the prefix is `MY_APP`, the library will look for environment variables like `MY_APP_REGIONS`, `MY_APP_ACCOUNT`, etc. These variables will be validated just like the CLI arguments. Any values provided on the CLI will override the environment variables.

## Printing Help

If the user provides `--help` as an argument the library will print out a help message with the available subcommands and arguments. This can also be done manually with the function `printHelpContents` which accepts the same arguments as `parseCliArguments`.

```typescript
//Given this config
parseCliArguments(
  'my-command',
  // optional commands
  [
    { name: 'init', description: 'Initialize my environment' },
    {
      name: 'execute',
      description: 'Run the download'
    }
  ],
  {
    expandAsterisk: {
      character: 'e',
      description: 'Expand a single wildcard asterisk (*) to all possible values',
      values: 'none'
    },
    invalidActionBehavior: {
      description: 'Behavior when an invalid action is encountered, defaults to remove',
      validValues: ['remove', 'error', 'include'],
      type: 'enum',
      values: 'single'
    },
    readWaitMs: {
      description: 'Milliseconds to wait between read operations',
      type: 'number',
      values: 'single'
    }
  },
  {
    operandsName: 'action'
  }
)
```

````

```bash
$ my-command --help
Usage: my-command [command] [options] [flags] [--] [action1] [action2]
Commands:
  init   : Initialize my environment
  execute: Run the download
Options:
  --expand-asterisk:         (-e) Expand a single wildcard asterisk (*) to all possible values.
  --invalid-action-behavior:      Behavior when an invalid action is encountered, defaults to remove. Must
                                  be one of: remove, error, include.
  --read-wait-ms:                 Milliseconds to wait between read operations. One number required
  --help:                         Print this help message and exit
````

## API

`parseCliArguments` and `printHelpContents` are the two main functions for arguments and help text. They take the same arguments.

- `commandName` - The name of the command. This is used in the help text.
- `subcommands` - An object or sub commands that can be provided. The key is the name of the subcommand and the value is the configuration. Can be an empty object `{}`.
  - `description` - The description of the subcommand. This is used in the help text.
  - `options` - An object of argument definitions. The key is the name of the argument that will be returned in your results and the value is the configuration. Option objects are the same as described in `cliOptions`
- `cliOptions` - An object of argument definitions. The key is the name of the argument that will be returned in your results and the value is the configuration. One of

  - Standard Argument:

    - `values` - The number of values the argument accepts. Can be `single` or `multiple`.
    - `type` - The type of the argument. Can be `string` or `number`.
    - `description` - The description of the argument. This is used in the help text.

  - Enum Argument:

    - `values` - The number of values the argument accepts. Can be `single` or `multiple`.
    - `type` - The type of the argument. Must be `enum`.
    - `validValues` - An array of valid values for the argument.
    - `description` - The description of the argument. This is used in the help text.

  - Boolean Argument:

    - `character` - The single character flag for the argument.
    - `values` - The number of values the argument accepts. Must be `none`.
    - `description` - The description of the argument. This is used in the help text.

- `additionalArgs` - An object of additional arguments. This can include:

  - `version` - The version of the command. If this is provided the argument `--version` will print out the version and exit.
  - `args` - Override the string array or arguments to parse, by default it will use `process.argv.slice(2)`.
  - `env` - Override the environment variables to use, by default it will use `process.env`.
  - `envPrefix` - A prefix to use for environment variables. If provided, the library will look for environment variables that start with the prefix and use them as defaults for the arguments. For example, if the prefix is `MY_APP`, the library will look for environment variables like `MY_APP_REGIONS`, `MY_APP_ACCOUNT`, etc. These variables will be validated just like the CLI arguments. Any values provided on the CLI will override the environment variables.
  - `operandsName` - The name of the operands. This is used in the help text. By default, this is `operand`.
  - `requireSubcommand` - If true, a subcommand is required. By default, this is false.

## Reading from stdin

The function `readStdin` can be used to read from stdin. It returns a promise that resolves with the string read from stdin.

```typescript
import { readStdin } from '@cloud-copilot/cli'

const stdin = await readStdin(undefined)
```

It optionally takes a read timeout in milliseconds to wait to receive the first byte before it assumes there is no input. This is useful if for instance your CLI is being piped input from another process that may more than a few seconds, such as a `curl` command to an API.

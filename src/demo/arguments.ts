import { parseCliArguments } from '../cli.js'

const cli = parseCliArguments(
  'src/demo/arguments.ts',
  {},
  {
    foo: {
      type: 'string',
      values: 'single',
      description: 'foo it up!'
    },
    bar: {
      type: 'string',
      values: 'multiple',
      description: 'bar it up!'
    },
    boomBaz: {
      type: 'number',
      values: 'multiple',
      description: 'Bazzy bazzy bazzer baz bat'
    },
    color: {
      type: 'enum',
      description: 'A color to choose',
      validValues: ['red', 'green', 'blue'],
      values: 'single'
    },
    amazing: {
      type: 'boolean',
      description: 'Make it amazing!',
      character: 'a'
    },
    spectacular: {
      type: 'boolean',
      description: 'Make it spectacular!',
      character: 's'
    },
    fantastic: {
      type: 'boolean',
      description: 'Make it fantastic!',
      character: 'f'
    }
  },
  {
    envPrefix: 'MY_APP'
  }
)

console.log(cli)

const foo: string | undefined = cli.args.foo
const color: 'red' | 'green' | 'blue' | undefined = cli.args.color
const amazing: boolean = cli.args.amazing

const badArg = cli.args.badArg //compile error
const subcommand = cli.subcommand // never

/*

// Automatic help
npx tsx src/demo/arguments.ts --help

//Single value argument
npx tsx src/demo/arguments.ts --foo
npx tsx src/demo/arguments.ts --foo hello
npx tsx src/demo/arguments.ts --foo hello boom bop

//Multi value argument
npx tsx src/demo/arguments.ts --bar a b c
npx tsx src/demo/arguments.ts --bar a b c d
npx tsx src/demo/arguments.ts --bar a b -- c d --foo

//Multiple arguments
npx tsx src/demo/arguments.ts --foo a --bar a b -- c d

// Enum
npx tsx src/demo/arguments.ts --color red
npx tsx src/demo/arguments.ts --color abc
echo $?

// Environment variables
MY_APP_COLOR=green npx tsx src/demo/arguments.ts
MY_APP_COLOR=green npx tsx src/demo/arguments.ts --color red
MY_APP_COLOR=orange npx tsx src/demo/arguments.ts --color red

// Ambiguous argument
npx tsx src/demo/arguments.ts --b abc

// Partial matching
npx tsx src/demo/arguments.ts --ba abc

//Booleans
npx tsx src/demo/arguments.ts --ama
npx tsx src/demo/arguments.ts --a
npx tsx src/demo/arguments.ts -a -s -f
npx tsx src/demo/arguments.ts -asf

 */

import { arrayValueArgument } from '../arguments/arrayValueArgument.js'
import { booleanArgument } from '../arguments/booleanArgument.js'
import { enumArgument } from '../arguments/enumArgument.js'
import { enumArrayArgument } from '../arguments/enumArrayArgument.js'
import { mapArgument } from '../arguments/mapArgument.js'
import { numberArgument, numberArrayArgument } from '../arguments/numberArguments.js'
import { singleValueArgument } from '../arguments/singleValueArgument.js'
import { stringArgument, stringArrayArgument } from '../arguments/stringArguments.js'
import { parseCliArguments } from '../cli.js'

// Custom argument type for Dates
const dateArgument = singleValueArgument<Date>((rawValue) => {
  const date = new Date(rawValue)
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format' }
  }
  return { valid: true, value: date }
})

const dateArrayArgument = arrayValueArgument<Date>((rawValue) => {
  const date = new Date(rawValue)
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format' }
  }
  return { valid: true, value: date }
})

const run = async () => {
  const cli = await parseCliArguments(
    'src/demo/arguments.ts',
    {},
    {
      stringWithDefault: stringArgument({
        description: 'A single string argument',
        defaultValue: 'hello'
      }),
      string: stringArgument({
        description: 'A single string argument without a default'
      }),
      stringArrayWithDefault: stringArrayArgument({
        description: 'An array of strings',
        defaultValue: ['world']
      }),
      stringArray: stringArrayArgument({
        description: 'An array of strings without a default'
      }),
      numWithDefault: numberArgument({
        description: 'A single number argument',
        defaultValue: 42
      }),
      num: numberArgument({
        description: 'A single number argument without a default'
      }),
      numArrayWithDefault: numberArrayArgument({
        description: 'An array of numbers',
        defaultValue: [1, 2, 3]
      }),
      numArray: numberArrayArgument({
        description: 'An array of numbers without a default'
      }),
      boolArg: booleanArgument({
        description: 'A boolean argument',
        character: 'b'
      }),
      enumWithDefault: enumArgument({
        description: 'An enum argument',
        validValues: ['enumA', 'enumB', 'enumC'],
        defaultValue: 'foo'
      }),
      enum: enumArgument({
        description: 'An enum argument',
        validValues: ['enum1', 'enum2', 'enum3']
      }),
      enumArrayWithDefault: enumArrayArgument({
        description: 'An enum array argument',
        validValues: ['enumOne', 'enumTwo', 'enumThree'],
        defaultValue: ['enumZero']
      }),
      enumArrayWithEmptyDefault: enumArrayArgument({
        description: 'An enum array argument',
        validValues: ['enumAlpha', 'enumBeta', 'enumCharlie'],
        defaultValue: []
      }),
      enumArray: enumArrayArgument({
        description: 'An enum array argument',
        validValues: ['enumFoo', 'enumBar']
      }),
      dateArg: dateArgument({
        description: 'A date argument without a default'
      }),
      dateArgWithDefault: dateArgument({
        description: 'A date argument with default',
        defaultValue: new Date()
      }),
      dateArr: dateArrayArgument({
        description: 'An array of dates without a default'
      }),
      dateArrWithDefault: dateArrayArgument({
        description: 'An array of dates with a default',
        defaultValue: []
      }),
      uniqueArg: stringArgument({
        description: 'An argument that can be partially matched'
      }),
      special: booleanArgument({
        description: 'Make it special',
        character: 's'
      }),
      fantastic: booleanArgument({
        description: 'Make it fantastic',
        character: 'f'
      }),
      amazing: booleanArgument({
        description: 'Make it amazing',
        character: 'a'
      }),
      mapArg: mapArgument({
        description: 'A map argument'
      }),
      mapArgWithDefault: mapArgument({
        description: 'A map argument with default',
        defaultValue: { defaultKey: ['defaultValue1', 'defaultValue2'] }
      })
    },
    {
      envPrefix: 'MY_APP'
    }
  )

  console.log(cli)

  cli.args.stringWithDefault // string
  cli.args.string // string | undefined
  cli.args.stringArrayWithDefault // string[]
  cli.args.stringArray // string[] | undefined
  cli.args.numWithDefault // number
  cli.args.num // number | undefined
  cli.args.boolArg // boolean
  cli.args.numArrayWithDefault // number[]
  cli.args.numArray // number[] | undefined
  cli.args.enumWithDefault // 'value1' | 'value2' | 'value3'
  cli.args.enum // 'value4' | 'value5' | 'value6' | undefined
  cli.args.enumArrayWithDefault // ('value7' | 'value8' | 'value9' | 'value10')[]
  cli.args.enumArrayWithEmptyDefault // ('value7' | 'value8' | 'value9')[]
  cli.args.enumArray // ('value7' | 'value8' | 'value9')[] | undefined
  cli.args.dateArg // Date | undefined
  cli.args.dateArgWithDefault // Date
  cli.args.dateArr // Date[] | undefined
  cli.args.dateArrWithDefault // Date[]
  cli.args.mapArg // Record<string, string[]> | undefined
  cli.args.mapArgWithDefault // Record<string, string[]>

  const badArg = cli.args.badArg //compile error
}

run().then(() => {})

/*

// Automatic help
npx tsx src/demo/arguments.ts --help

//Single value argument
npx tsx src/demo/arguments.ts --string
npx tsx src/demo/arguments.ts --string hello
npx tsx src/demo/arguments.ts --string hello boom bop

//Multi value argument
npx tsx src/demo/arguments.ts --string-array a b c
npx tsx src/demo/arguments.ts --string-array a b c d
npx tsx src/demo/arguments.ts --string-array a b -- c d --foo

//Multiple arguments
npx tsx src/demo/arguments.ts --string a --string-array a b -- c d

// Enum
npx tsx src/demo/arguments.ts --enum enum1
npx tsx src/demo/arguments.ts --enum enum2
echo $?

// Environment variables
MY_APP_ENUM=enum1 npx tsx src/demo/arguments.ts
MY_APP_ENUM=enum2 npx tsx src/demo/arguments.ts --color enum1
MY_APP_ENUM=enum3 npx tsx src/demo/arguments.ts --color enum1

// Ambiguous argument
npx tsx src/demo/arguments.ts --d abc

// Partial matching
npx tsx src/demo/arguments.ts --u abc

//Booleans
npx tsx src/demo/arguments.ts --amaz
npx tsx src/demo/arguments.ts -a -s -f
npx tsx src/demo/arguments.ts -asf

 */

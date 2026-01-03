import { describe, expectTypeOf, it } from 'vitest'
import { arrayValueArgument } from './arguments/arrayValueArgument.js'
import { booleanArgument } from './arguments/booleanArgument.js'
import { enumArgument } from './arguments/enumArgument.js'
import { enumArrayArgument } from './arguments/enumArrayArgument.js'
import { mapArgument } from './arguments/mapArgument.js'
import { numberArgument, numberArrayArgument } from './arguments/numberArguments.js'
import { singleValueArgument } from './arguments/singleValueArgument.js'
import { stringArgument, stringArrayArgument } from './arguments/stringArguments.js'
import { parseCliArguments } from './cli.js'

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

describe('parseCliArguments types', () => {
  it('should have correct types for string arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        stringWithDefault: stringArgument({
          description: 'A single string argument',
          defaultValue: 'hello'
        }),
        string: stringArgument({
          description: 'A single string argument without a default'
        })
      }
    )

    // string with default should be string
    expectTypeOf(cli.args.stringWithDefault).toEqualTypeOf<string>()
    // string without default should be string | undefined
    expectTypeOf(cli.args.string).toEqualTypeOf<string | undefined>()
  })

  it('should have correct types for string array arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        stringArrayWithDefault: stringArrayArgument({
          description: 'An array of strings',
          defaultValue: ['world']
        }),
        stringArray: stringArrayArgument({
          description: 'An array of strings without a default'
        })
      }
    )

    // string array with default should be string[]
    expectTypeOf(cli.args.stringArrayWithDefault).toEqualTypeOf<string[]>()
    // string array without default should be string[] | undefined
    expectTypeOf(cli.args.stringArray).toEqualTypeOf<string[] | undefined>()
  })

  it('should have correct types for number arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        numWithDefault: numberArgument({
          description: 'A single number argument',
          defaultValue: 42
        }),
        num: numberArgument({
          description: 'A single number argument without a default'
        })
      }
    )

    // number with default should be number
    expectTypeOf(cli.args.numWithDefault).toEqualTypeOf<number>()
    // number without default should be number | undefined
    expectTypeOf(cli.args.num).toEqualTypeOf<number | undefined>()
  })

  it('should have correct types for number array arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        numArrayWithDefault: numberArrayArgument({
          description: 'An array of numbers',
          defaultValue: [1, 2, 3]
        }),
        numArray: numberArrayArgument({
          description: 'An array of numbers without a default'
        })
      }
    )

    // number array with default should be number[]
    expectTypeOf(cli.args.numArrayWithDefault).toEqualTypeOf<number[]>()
    // number array without default should be number[] | undefined
    expectTypeOf(cli.args.numArray).toEqualTypeOf<number[] | undefined>()
  })

  it('should have correct types for boolean arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        boolArg: booleanArgument({
          description: 'A boolean argument',
          character: 'b'
        })
      }
    )

    // boolean should always be boolean (never undefined)
    expectTypeOf(cli.args.boolArg).toEqualTypeOf<boolean>()
  })

  it('should have correct types for enum arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        enumWithDefault: enumArgument({
          description: 'An enum argument',
          validValues: ['enumA', 'enumB', 'enumC'],
          defaultValue: 'enumA'
        }),
        enum: enumArgument({
          description: 'An enum argument',
          validValues: ['enum1', 'enum2', 'enum3']
        })
      }
    )

    // enum with default should be union of valid values
    expectTypeOf(cli.args.enumWithDefault).toEqualTypeOf<'enumA' | 'enumB' | 'enumC'>()
    // enum without default should be union of valid values | undefined
    expectTypeOf(cli.args.enum).toEqualTypeOf<'enum1' | 'enum2' | 'enum3' | undefined>()
  })

  it('should have correct types for enum array arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        enumArrayWithDefault: enumArrayArgument({
          description: 'An enum array argument',
          validValues: ['enumOne', 'enumTwo', 'enumThree'],
          defaultValue: ['enumOne']
        }),
        enumArrayWithEmptyDefault: enumArrayArgument({
          description: 'An enum array argument',
          validValues: ['enumAlpha', 'enumBeta', 'enumCharlie'],
          defaultValue: []
        }),
        enumArray: enumArrayArgument({
          description: 'An enum array argument',
          validValues: ['enumFoo', 'enumBar']
        })
      }
    )

    // enum array with default should be array of union of valid values
    expectTypeOf(cli.args.enumArrayWithDefault).toEqualTypeOf<
      ('enumOne' | 'enumTwo' | 'enumThree')[]
    >()
    // enum array with empty default should be array of union of valid values
    expectTypeOf(cli.args.enumArrayWithEmptyDefault).toEqualTypeOf<
      ('enumAlpha' | 'enumBeta' | 'enumCharlie')[]
    >()
    // enum array without default should be array of union | undefined
    expectTypeOf(cli.args.enumArray).toEqualTypeOf<('enumFoo' | 'enumBar')[] | undefined>()
  })

  it('should have correct types for custom date arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        dateArg: dateArgument({
          description: 'A date argument without a default'
        }),
        dateArgWithDefault: dateArgument({
          description: 'A date argument with default',
          defaultValue: new Date()
        })
      }
    )

    // date without default should be Date | undefined
    expectTypeOf(cli.args.dateArg).toEqualTypeOf<Date | undefined>()
    // date with default should be Date
    expectTypeOf(cli.args.dateArgWithDefault).toEqualTypeOf<Date>()
  })

  it('should have correct types for custom date array arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        dateArr: dateArrayArgument({
          description: 'An array of dates without a default'
        }),
        dateArrWithDefault: dateArrayArgument({
          description: 'An array of dates with a default',
          defaultValue: []
        })
      }
    )

    // date array without default should be Date[] | undefined
    expectTypeOf(cli.args.dateArr).toEqualTypeOf<Date[] | undefined>()
    // date array with default should be Date[]
    expectTypeOf(cli.args.dateArrWithDefault).toEqualTypeOf<Date[]>()
  })

  it('should have correct types for map arguments', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        mapArg: mapArgument({
          description: 'A map argument'
        }),
        mapArgWithDefault: mapArgument({
          description: 'A map argument with default',
          defaultValue: { defaultKey: ['defaultValue1', 'defaultValue2'] }
        })
      }
    )

    // map without default should be Record<string, string[]> | undefined
    expectTypeOf(cli.args.mapArg).toEqualTypeOf<Record<string, string[]> | undefined>()
    // map with default should be Record<string, string[]>
    expectTypeOf(cli.args.mapArgWithDefault).toEqualTypeOf<Record<string, string[]>>()
  })

  it('should not allow accessing non-existent argument keys', async () => {
    const cli = await parseCliArguments(
      'test',
      {},
      {
        existingArg: stringArgument({
          description: 'An existing argument'
        })
      }
    )

    // @ts-expect-error - badArg does not exist on args
    cli.args.badArg
  })
})

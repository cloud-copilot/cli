import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type ArrayValueValidator<ValueType> = (
  rawValue: string
) => Promise<ValidatedValues<ValueType>> | ValidatedValues<ValueType>

type ArrayWithDefault<ValueType> = { defaultValue: ValueType[] } & PerArgumentArgs
type ArrayWithoutDefault<ValueType> = { defaultValue?: undefined } & PerArgumentArgs
type ArrayWithOptionalDefault<ValueType> = {
  defaultValue?: ValueType[] | undefined
} & PerArgumentArgs

/**
 * Creates an array value argument factory for a specific type
 */
export function arrayValueArgument<ValueType>(
  validator: ArrayValueValidator<ValueType>,
  descriptionSuffix: string = ''
) {
  function createArgument(options: ArrayWithDefault<ValueType>): Argument<ValueType[]>
  function createArgument(
    options: ArrayWithoutDefault<ValueType>
  ): Argument<ValueType[] | undefined>
  function createArgument(
    options: ArrayWithOptionalDefault<ValueType>
  ): Argument<ValueType[]> | Argument<ValueType[] | undefined> {
    return {
      description: options.description + descriptionSuffix,
      validateValues: async (
        current: ValueType[] | undefined,
        values: string[],
        isCurrentlyDefaulted: boolean
      ): Promise<ValidatedValues<ValueType[]>> => {
        if (values.length === 0) {
          return { valid: false, message: 'at least one value is required' }
        }

        const validatedValues: ValueType[] = []
        for (const rawValue of values) {
          const result = await validator(rawValue)
          if (!result.valid) {
            return result
          }
          validatedValues.push(result.value)
        }

        return { valid: true, value: validatedValues }
      },
      reduceValues: async (
        current: ValueType[] | undefined,
        newValues: ValueType[],
        isCurrentlyDefaulted?: boolean
      ) => {
        if (isCurrentlyDefaulted || !current) {
          return newValues
        }
        current.push(...newValues)
        return current
      },
      defaultValue: options.defaultValue,
      acceptMultipleValues: () => true
    }
  }

  return createArgument
}

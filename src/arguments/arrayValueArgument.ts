import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type ArrayValueValidator<ValueType> = (
  rawValue: string
) => Promise<ValidatedValues<ValueType>> | ValidatedValues<ValueType>

/**
 * Creates an array value argument factory for a specific type
 */
export function arrayValueArgument<ValueType>(
  validator: ArrayValueValidator<ValueType>,
  descriptionSuffix: string = ''
) {
  function createArgument<const O extends { defaultValue: ValueType[] } & PerArgumentArgs>(
    options: O
  ): Argument<ValueType[]>
  function createArgument<const O extends { defaultValue?: undefined } & PerArgumentArgs>(
    options: O
  ): Argument<ValueType[] | undefined>
  function createArgument<
    const O extends { defaultValue?: ValueType[] | undefined } & PerArgumentArgs
  >(options: O): Argument<ValueType[]> | Argument<ValueType[] | undefined> {
    return {
      description: options.description + descriptionSuffix,
      validateValues: async (
        current: ValueType[] | undefined,
        values: string[]
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
      reduceValues: async (current: ValueType[] | undefined, newValues: ValueType[]) => {
        if (!current) {
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

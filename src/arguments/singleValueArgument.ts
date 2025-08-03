import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type SingleValueValidator<ValueType> = (
  rawValue: string
) => Promise<ValidatedValues<ValueType>> | ValidatedValues<ValueType>

/**
 * Creates a single value argument factory for a specific type
 */
export function singleValueArgument<ValueType>(
  validator: SingleValueValidator<ValueType>,
  descriptionSuffix: string = ''
) {
  function createArgument<const O extends { defaultValue: ValueType } & PerArgumentArgs>(
    options: O
  ): Argument<ValueType>
  function createArgument<const O extends { defaultValue?: undefined } & PerArgumentArgs>(
    options: O
  ): Argument<ValueType | undefined>
  function createArgument<
    const O extends { defaultValue?: ValueType | undefined } & PerArgumentArgs
  >(options: O): Argument<ValueType> | Argument<ValueType | undefined> {
    return {
      description: options.description + descriptionSuffix,
      validateValues: async (
        currentValue: ValueType | undefined,
        values: string[]
      ): Promise<ValidatedValues<ValueType>> => {
        if (currentValue !== undefined && currentValue != options.defaultValue) {
          return {
            valid: false,
            message: 'expects a single values but was set multiple times'
          }
        }
        if (values.length == 0) {
          return { valid: false, message: 'a value is required' }
        }
        if (values.length > 1) {
          return {
            valid: false,
            message: 'expects a single value but received ' + values.join(', ')
          }
        }

        return validator(values[0])
      },
      reduceValues: async (current: ValueType | undefined, newValue: ValueType) => newValue,
      defaultValue: options.defaultValue
    }
  }

  return createArgument
}

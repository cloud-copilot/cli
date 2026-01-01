import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type SingleValueValidator<ValueType> = (
  rawValue: string
) => Promise<ValidatedValues<ValueType>> | ValidatedValues<ValueType>

type ArgumentWithDefault<ValueType> = { defaultValue: ValueType } & PerArgumentArgs
type ArgumentWithoutDefault<ValueType> = { defaultValue?: undefined } & PerArgumentArgs
type ArgumentWithOptionalDefault<ValueType> = {
  defaultValue?: ValueType | undefined
} & PerArgumentArgs

/**
 * Creates a single value argument factory for a specific type
 */
export function singleValueArgument<ValueType>(
  validator: SingleValueValidator<ValueType>,
  descriptionSuffix: string = ''
) {
  function createArgument(options: ArgumentWithDefault<ValueType>): Argument<ValueType>
  function createArgument(
    options: ArgumentWithoutDefault<ValueType>
  ): Argument<ValueType | undefined>
  function createArgument(
    options: ArgumentWithOptionalDefault<ValueType>
  ): Argument<ValueType> | Argument<ValueType | undefined> {
    return {
      description: options.description + descriptionSuffix,
      validateValues: async (
        currentValue: ValueType | undefined,
        values: string[],
        isCurrentlyDefaulted: boolean
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
      reduceValues: async (
        current: ValueType | undefined,
        newValue: ValueType,
        isCurrentlyDefaulted: boolean
      ) => newValue,
      defaultValue: options.defaultValue
    }
  }

  return createArgument
}

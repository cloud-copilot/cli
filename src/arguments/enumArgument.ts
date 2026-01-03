import { NoExtraKeys } from '../utils.js'
import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type EnumType<T extends { validValues: string[]; defaultValue?: string | undefined }> =
  T['defaultValue'] extends string
    ? T['validValues'][number] | T['defaultValue']
    : T['validValues'][number]

type EnumOptions = { defaultValue?: string; validValues: string[] } & PerArgumentArgs

export function enumArgument<
  const O extends { defaultValue: string; validValues: string[] } & PerArgumentArgs
>(options: NoExtraKeys<O, EnumOptions>): Argument<EnumType<O>>
export function enumArgument<
  const O extends { defaultValue?: undefined; validValues: string[] } & PerArgumentArgs
>(options: NoExtraKeys<O, EnumOptions>): Argument<EnumType<O> | undefined>
export function enumArgument<
  const O extends { defaultValue?: string | undefined; validValues: string[] } & PerArgumentArgs
>(options: NoExtraKeys<O, EnumOptions>): Argument<EnumType<O>> | Argument<EnumType<O> | undefined> {
  return {
    description:
      options.description +
      `. One value required, valid values are: ${options.validValues.join(', ')}`,
    validateValues: (
      currentValue: EnumType<O> | undefined,
      values: string[],
      isCurrentlyDefaulted: boolean
    ): ValidatedValues<EnumType<O>> => {
      if (values.length == 0) {
        return { valid: false, message: 'a value is required' }
      }
      if (currentValue != options.defaultValue) {
        return { valid: false, message: 'expects a single value but was set multiple times' }
      }
      if (values.length > 1) {
        return {
          valid: false,
          message: 'expects a single value but received ' + values.join(', ')
        }
      }
      const value = values[0]
      const match = options.validValues.find((v) => v.toLowerCase() === value.toLowerCase())
      if (!match) {
        return {
          valid: false,
          message: `${value} is not one of the allowed values: ${options.validValues.join(', ')}`
        }
      }

      return { valid: true, value: match as EnumType<O> }
    },
    reduceValues: (
      current: EnumType<O> | undefined,
      newValue: EnumType<O>,
      isCurrentlyDefaulted: boolean
    ) => newValue,
    defaultValue: options.defaultValue
  }
}

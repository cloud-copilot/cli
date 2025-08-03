import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type EnumArrayType<T extends { validValues: string[]; defaultValue?: string[] | undefined }> =
  T['defaultValue'] extends string[]
    ? T['validValues'][number] | T['defaultValue'][number]
    : T['validValues'][number]

export function enumArrayArgument<
  const O extends { defaultValue: string[]; validValues: string[] } & PerArgumentArgs
>(options: O): Argument<EnumArrayType<O>[]>
export function enumArrayArgument<
  const O extends { defaultValue?: undefined; validValues: string[] } & PerArgumentArgs
>(options: O): Argument<EnumArrayType<O>[] | undefined>
export function enumArrayArgument<
  const O extends { defaultValue?: string[] | undefined; validValues: string[] } & PerArgumentArgs
>(options: O): Argument<EnumArrayType<O>[]> | Argument<EnumArrayType<O>[] | undefined> {
  return {
    description:
      options.description +
      `. One or more values required, valid values are: ${options.validValues.join(', ')})`,
    validateValues: async (
      currentValue: EnumArrayType<O>[] | undefined,
      values: string[]
    ): Promise<ValidatedValues<EnumArrayType<O>[]>> => {
      if (values.length == 0) {
        return { valid: false, message: 'At least one value is required' }
      }
      const invalidValues: string[] = []
      const validValues: EnumArrayType<O>[] = []
      for (const value of values) {
        const match = options.validValues.find((v) => v.toLowerCase() === value.toLowerCase())
        if (!match) {
          invalidValues.push(value)
        } else {
          validValues.push(match as EnumArrayType<O>)
        }
      }

      if (invalidValues.length > 0) {
        return {
          valid: false,
          message: `${invalidValues.map((v) => `${v}`).join(', ')} is not one of the allowed values: ${options.validValues.join(', ')}`
        }
      }

      return { valid: true, value: validValues }
    },
    reduceValues: async (
      current: EnumArrayType<O>[] | undefined,
      newValues: EnumArrayType<O>[]
    ) => {
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

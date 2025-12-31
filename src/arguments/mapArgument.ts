import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

type MapResult = Record<string, string[]>

type MapWithDefault = { defaultValue: MapResult } & PerArgumentArgs
type MapWithoutDefault = { defaultValue?: undefined } & PerArgumentArgs
type MapWithOptionalDefault = { defaultValue?: MapResult | undefined } & PerArgumentArgs

/**
 * Creates a map argument where the first value is the key and the rest are values.
 *
 * --arg-name key1 key1Value1 key1Value2 --arg-name key2 key2Value1 key2Value2
 *
 * @param options the description and optional default value
 * @returns a map argument
 */
export function mapArgument(options: MapWithDefault): Argument<MapResult>
export function mapArgument(options: MapWithoutDefault): Argument<MapResult | undefined>
export function mapArgument(
  options: MapWithOptionalDefault
): Argument<MapResult> | Argument<MapResult | undefined> {
  return {
    description: options.description + `. Each instance requires a key and at least one value.`,
    validateValues: async (
      currentValue: MapResult | undefined,
      values: string[]
    ): Promise<ValidatedValues<MapResult>> => {
      const [first, ...rest] = values
      if (!first) {
        return { valid: false, message: 'a key is required and at least one value is required' }
      }
      if (rest.length < 1) {
        return { valid: false, message: `${first} requires at least one value` }
      }
      if (currentValue && first in currentValue) {
        return { valid: false, message: `${first} is set multiple times` }
      }
      return {
        valid: true,
        value: {
          [first]: rest
        }
      }
    },
    reduceValues: async (current: MapResult | undefined, newValue: MapResult) => {
      if (!current) {
        return { ...newValue }
      }
      return { ...current, ...newValue }
    },
    defaultValue: options.defaultValue,
    acceptMultipleValues: () => true
  }
}

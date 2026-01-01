import { Argument, PerArgumentArgs, ValidatedValues } from './argument.js'

/**
 * Creates a boolean argument that is false by default and true if present.
 *
 * @param options the description and the single character that can be used to set the value to true
 * @returns a boolean argument
 */
export function booleanArgument(
  options: { character: string } & PerArgumentArgs
): Argument<boolean> {
  return {
    description: options.description,
    character: options.character,
    validateValues: (
      currentValue: boolean,
      value: string[],
      isCurrentlyDefaulted: boolean
    ): ValidatedValues<boolean> => {
      if (value.length == 0) {
        return { valid: true, value: true }
      }
      return { valid: false, message: `does not accept values but received ${value.join(', ')}` }
    },
    reduceValues: (current: boolean, newValue: boolean, isCurrentlyDefaulted: boolean) => current,
    present: (currentValue: boolean) => true,
    defaultValue: false
  }
}

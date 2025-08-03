export type ValidValue<T> = { valid: true; value: T }
export type InvalidValue = { valid: false; message: string }
export type ValidatedValues<T> = ValidValue<T> | InvalidValue

export type Argument<ArgumentType> = {
  /**
   * A description of the argument, used in help text.
   */
  description: string

  /**
   * The default value of the argument, if any.
   * If not provided, the argument will be undefined until a value is provided.
   */
  defaultValue: ArgumentType

  /**
   * Validate all values passed to the argument at once.
   * @param values the array of strings passed to the argument
   * @returns if the value is invalid, returns { valid: false, message: string } and message will be shown to the user.
   *          if the value is valid, returns { valid: true, values`: ArgumentType[] } where value is the parsed value.
   */
  validateValues: (
    currentValue: ArgumentType,
    values: string[]
  ) => Promise<ValidValue<ArgumentType> | InvalidValue> | ValidValue<ArgumentType> | InvalidValue

  /**
   * Reduces the current value and a new values into a single value.
   *
   * @param current the current value of the argument, can be undefined if there is no default value
   * @param newValues the new values being added as parsed by validateValues
   * @returns the new value of the argument
   */
  reduceValues: (
    currentValue: ArgumentType,
    newValues: NonNullable<ArgumentType>
  ) => Promise<ArgumentType> | ArgumentType

  /**
   * If this callback is provided, it will be called when the argument is present
   *
   * @param currentValue the current value of the argument
   * @returns the value to set the argument to
   */
  present?(currentValue: ArgumentType): Promise<ArgumentType> | ArgumentType

  /**
   * If this function is provided, it will be called to determine if the argument
   * can accept multiple values.
   *
   * If not provided, the argument will only accept a single value.
   *
   * @returns true if the argument can accept multiple values, false otherwise
   */
  acceptMultipleValues?(): boolean

  /**
   * A single-character alias for the argument, e.g. 'f' for --foo
   *
   * This is only valid if the argument does not take a value (e.g. boolean flags).
   */
  character?: string // single-character alias, e.g. 'f' for --foo
}

export type PerArgumentArgs = Pick<Argument<any>, 'description'>
export type CustomArgument<ArgumentType> = Omit<Argument<ArgumentType>, 'character'>

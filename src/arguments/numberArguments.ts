import { ValidatedValues } from './argument.js'
import { arrayValueArgument } from './arrayValueArgument.js'
import { singleValueArgument } from './singleValueArgument.js'

function validateNumber(rawValue: string): ValidatedValues<number> {
  const num = Number(rawValue)
  if (isNaN(num)) {
    return { valid: false, message: `expects a number but received ${rawValue}` }
  }
  return { valid: true, value: num }
}

export const numberArgument = singleValueArgument<number>(validateNumber, '. One number required.')

export const numberArrayArgument = arrayValueArgument<number>(
  validateNumber,
  '. One or more numbers required.'
)

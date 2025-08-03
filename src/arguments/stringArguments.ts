import { arrayValueArgument } from './arrayValueArgument.js'
import { singleValueArgument } from './singleValueArgument.js'

export const stringArgument = singleValueArgument<string>(
  (rawValue) => ({
    valid: true,
    value: rawValue
  }),
  '. One string required.'
)

export const stringArrayArgument = arrayValueArgument<string>(
  (rawValue) => ({
    valid: true,
    value: rawValue
  }),
  '. One or more strings required.'
)

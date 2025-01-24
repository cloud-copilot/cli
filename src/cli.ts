import { exit } from './utils.js'

/**
 * A boolean argument that has no values.
 */
export type BooleanArgument = {
  /**
   * The single character flag for the argument.
   */
  character: string

  /**
   * Must be 'none' for a boolean argument.
   */
  values: 'none'

  /**
   * The description of the argument.
   */
  description: string
}

/**
 * A standard argument that has one or more values.
 */
export type StandardArgument = {
  /**
   * Whether the argument accepts single or multiple values.
   */
  values: 'single' | 'multiple'

  /**
   * The type of the values accepted.
   */
  type: 'string' | 'number'

  /**
   * The description of the argument.
   */
  description: string
}

export type EnumArgument = {
  /**
   * Whether the argument accepts single or multiple values.
   */
  values: 'single' | 'multiple'

  /**
   * Must be 'enum' for an enum argument.
   */
  type: 'enum'

  /**
   * The valid values for the argument.
   */
  validValues: string[]

  /**
   * The description of the argument.
   */
  description: string
}

/**
 * A CLI argument that can be accepted for a command.
 */
export type CliArgument = BooleanArgument | StandardArgument | EnumArgument

export type Command = {
  description: string
  options: Record<string, CliArgument>
}

function isBooleanOption(option: CliArgument): option is BooleanArgument {
  return (option as BooleanArgument).values === 'none'
}

function isEnumOption(option: CliArgument): option is EnumArgument {
  return (option as EnumArgument).type === 'enum'
}

export type OptionConfig = {
  type: 'string' | 'number' | 'boolean'
  values: 'single' | 'multiple'
  description: string
  character?: string
}

/**
 * A map of CLI argument keys to their configuration.
 */
export type Config<T extends Record<string, CliArgument>> = T

/**
 * Create a type safe configuration for CLI arguments.
 *
 * @param config the configuration for the CLI arguments.
 * @returns the configuration object.
 */
export function createConfig<T extends Record<string, CliArgument>>(config: T): T {
  return config
}

type ParsedArgs<T extends Record<string, CliArgument>> = {
  [K in keyof T as K]: T[K] extends {
    type: 'string'
  }
    ? T[K]['values'] extends 'single'
      ? string | undefined
      : string[]
    : T[K] extends {
          type: 'number'
        }
      ? T[K]['values'] extends 'single'
        ? number | undefined
        : number[]
      : T[K] extends {
            type: 'boolean'
          }
        ? boolean
        : never
}

interface ArgumentChunk {
  first: string
  rest: string[]
  isFirst: boolean
  isLast: boolean
}

/**
 * Additional arguments that can be used to configure the CLI parser.
 */
export interface AdditionalCliArguments {
  /**
   * The version of the CLI command. If provided, the CLI provides a --version flag that prints the version and exits.
   */
  version?: string

  /**
   * The argument string from the CLI. If not provided, the process.argv.slice(2) is used.
   */
  args?: string[]

  /**
   * The environment variables to use for parsing. If not provided, process.env is used.
   */
  env?: Record<string, string>

  /**
   * The prefix to use for environment variables. If provided, the CLI will look for environment variables with the prefix followed by an underscore.
   */
  envPrefix?: string

  /**
   * The name of the operands to display in the help message. Defaults to "operands".
   */
  operandsName?: string

  /**
   * Whether a subcommand is required. If true, the CLI will exit with an error if no subcommand is provided.
   */
  requireSubcommand?: boolean

  /**
   * If there are zero arguments, show the help message. Defaults to false.
   */
  showHelpIfNoArgs?: boolean
}

export type SelectedCommandWithArgs<
  C extends Record<string, Command>,
  O extends Record<string, CliArgument>
> = keyof C extends never
  ? {
      command: undefined
      args: ParsedArgs<O>
      operands: string[]
      anyValues: boolean
    }
  : {
      [K in keyof C]: {
        command: K
        args: ParsedArgs<C[K]['options']> & ParsedArgs<O>
        operands: string[]
        anyValues: boolean
      }
    }[keyof C]

/**
 * Parse CLI Arguments and return the parsed typesafe results.
 *
 * @param command the name of the command arguments are being parsed for.
 * @param subcommands the list of subcommands that can be used, if any.
 * @param cliOptions the configuration options for the CLI command.
 * @param additionalArgs additional arguments to be used for parsing and displaying help.
 * @returns the parsed arguments, operands, and subcommand if applicable.
 */
export function parseCliArguments<
  O extends Record<string, CliArgument>,
  C extends Record<string, Command>
>(
  command: string,
  subcommands: C,
  cliOptions: Config<O>,
  additionalArgs?: AdditionalCliArguments
): SelectedCommandWithArgs<C, O> {
  const args = additionalArgs?.args ?? process.argv.slice(2)
  const env = additionalArgs?.env ?? process.env
  const parsedArgs: any = {}
  const operands: string[] = []
  const booleanOptions: Record<string, string> = {}
  const subcommandKeys = Object.keys(subcommands)
  const numberOfSubcommands = subcommandKeys.length
  const combinedOptions: Record<string, CliArgument> = { ...cliOptions }
  let subcommand: string | undefined

  if (args.length === 0 && additionalArgs?.showHelpIfNoArgs) {
    printHelpContents(command, subcommands, cliOptions, additionalArgs)
    exit(0, undefined)
    return {} as any
  }

  // Step 1: Initialize defaults
  initializeOptionDefaults(parsedArgs, booleanOptions, cliOptions)

  // Step 2: Handle environment variables
  parseEnvironmentVariables(cliOptions, parsedArgs, env, additionalArgs?.envPrefix)

  if (additionalArgs?.envPrefix) {
    const prefix = additionalArgs.envPrefix + '_'
    const envToKeys = Object.keys(cliOptions).reduce(
      (acc, key) => {
        acc[camelToCapitalSnakeCase(key)] = key
        return acc
      },
      {} as Record<string, string>
    )

    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith(prefix)) {
        const optionKey = key.slice(prefix.length)
        const option = envToKeys[optionKey]
        if (option) {
          const config = combinedOptions[option]
          if (isEnumOption(config)) {
            if (config.values === 'single') {
              const matchingValue = config.validValues.find(
                (v) => v.toLowerCase() === value!.toLowerCase()
              )
              if (!matchingValue) {
                exit(
                  2,
                  `Environment ${key} allows only the following values: ${config.validValues.join(', ')}`
                )
              }
              parsedArgs[option] = matchingValue
            } else if (config.values === 'multiple') {
              const invalidValues = []
              const validValues = []
              const values = value!.split(' ')
              for (const v of values) {
                const matchingValue = config.validValues.find(
                  (valid) => valid.toLowerCase() === v.toLowerCase()
                )
                if (matchingValue) {
                  validValues.push(matchingValue)
                } else {
                  invalidValues.push(value)
                }
              }
              if (invalidValues.length > 0) {
                exit(
                  2,
                  `Environment ${key} allows only the following values: ${config.validValues.join(', ')}`
                )
              }
              parsedArgs[option] = validValues
            }
          } else if (config.values === 'none') {
            parsedArgs[option] = true
          } else if (config.values === 'single') {
            const { parsed, invalid } = validateTypes(config.type, value!)
            if (invalid.length > 0) {
              exit(
                2,
                `Environment ${key} expects a valid ${config.type}, but received: ${invalid.join(', ')}`
              )
            }
            parsedArgs[option] = parsed
          } else if (config.values === 'multiple') {
            const values = value!.split(' ')
            const { parsed, invalid } = validateTypes(config.type, values)
            if (invalid.length > 0) {
              exit(
                2,
                `Environment ${key} expects a valid ${config.type}, but received: ${invalid.join(', ')}`
              )
            }
            parsedArgs[option] = parsed
          }
        }
      }
    }
  }

  // Step 3: Group arguments into objects
  const commandChunks = groupArguments(args)

  // Step 4: Validation and parsing arguments
  for (const { first, rest, isLast, isFirst } of commandChunks) {
    // Handle --help and --version
    if (first === '--help') {
      printHelpContents(command, subcommands, cliOptions, additionalArgs, subcommand)
      exit(0, undefined)
    }

    if (first === '--version') {
      if (additionalArgs?.version) {
        exit(0, additionalArgs?.version)
      }
    }

    // Handle commands if applicable
    if (isFirst && !first.startsWith('-')) {
      if (numberOfSubcommands === 0) {
        if (isLast) {
          operands.push(first, ...rest)
        } else {
          exit(2, `Invalid: ${first}, all options must specified using a --argument`)
        }
      } else {
        if (!isLast && rest.length > 0) {
          exit(2, `Options must be specified using a --argument, ${rest.join(' ')} is ambiguous`)
        }
        const matchingCommands = subcommandKeys.filter((cmd) =>
          cmd.toLowerCase().startsWith(first.toLowerCase())
        )

        if (matchingCommands.length === 0) {
          exit(2, `Unknown command: ${first}`)
          return {} as any
        } else if (matchingCommands.length > 1) {
          exit(2, `Ambiguous command: ${first}`)
          return {} as any
        }
        subcommand = matchingCommands.at(0)!
        const subcommandOptions = subcommands[subcommand].options
        initializeOptionDefaults(parsedArgs, booleanOptions, subcommandOptions)
        parseEnvironmentVariables(subcommandOptions, parsedArgs, env, additionalArgs?.envPrefix)
        for (const [key, option] of Object.entries(subcommandOptions)) {
          combinedOptions[key] = option
        }
        operands.push(...rest)
      }
    }

    // Validate options
    if (first == '--') {
      operands.push(...rest)
    } else if (first.startsWith('--')) {
      const key = first.slice(2).replaceAll('-', '').toLowerCase()
      const matchingOptions = Object.keys(combinedOptions).filter((k) =>
        k.toLowerCase().startsWith(key)
      )

      let matchingOption: string | undefined = undefined
      if (matchingOptions.length === 1) {
        matchingOption = matchingOptions[0]
      } else if (matchingOptions.length > 1) {
        exit(2, `Ambiguous argument: ${first}`)
      } else {
        exit(2, `Unknown argument: ${first}`)
      }

      if (!matchingOption) {
        exit(2, `Unknown option: ${first}`)
        return {} as any
      }

      const optionConfig = combinedOptions[matchingOption!]
      if (isEnumOption(optionConfig)) {
        if (rest.length === 0) {
          if (optionConfig.values === 'single') {
            exit(2, `Option ${first} expects a value, but received none`)
          } else {
            exit(2, `Option ${first} expects at least one value, but received none`)
          }
          return {} as any
        }
        if (optionConfig.values === 'single') {
          if (rest.length > 1 && !isLast) {
            exit(
              2,
              `Option ${first} expects a single value, but received multiple: ${rest.join(', ')}`
            )
          }
          const value = rest[0]
          const matchingValue = optionConfig.validValues.find(
            (v) => v.toLowerCase() === value.toLowerCase()
          )
          if (!matchingValue) {
            exit(
              2,
              `Option ${first} allows only the following values: ${optionConfig.validValues.join(', ')}`
            )
          }
          parsedArgs[matchingOption] = matchingValue
          operands.push(...rest.slice(1))
        } else if (optionConfig.values === 'multiple') {
          const invalidValues = []
          const validValues = []
          for (const value of rest) {
            const matchingValue = optionConfig.validValues.find(
              (v) => v.toLowerCase() === value.toLowerCase()
            )
            if (matchingValue) {
              validValues.push(matchingValue)
            } else {
              invalidValues.push(value)
            }
          }
          if (invalidValues.length > 0) {
            exit(
              2,
              `Option ${first} allows only the following values: ${optionConfig.validValues.join(', ')}`
            )
          }
          parsedArgs[matchingOption] = validValues
        }
      } else if (optionConfig.values === 'none') {
        //set boolean value
        parsedArgs[matchingOption] = true
        //Handle extra values
        if (rest.length > 0) {
          if (!isLast) {
            exit(2, `Boolean option ${first} does not accept values`)
          } else {
            operands.push(...rest)
          }
        }
      } else if (optionConfig.values === 'single') {
        if (rest.length === 0) {
          exit(2, `Option ${first} expects a value, but received none`)
        }

        //Validate the value
        const { parsed, invalid } = validateTypes(optionConfig.type, rest[0])
        if (invalid.length > 0) {
          exit(
            2,
            `Option ${first} expects a valid ${optionConfig.type}, but received: ${invalid.join(', ')}`
          )
        }

        //Set the value
        parsedArgs[matchingOption] = parsed

        if (rest.length > 1) {
          if (!isLast) {
            exit(
              2,
              `Option ${first} expects a single value, but received multiple: ${rest.join(', ')}`
            )
          } else {
            operands.push(...rest.slice(1))
          }
        }
      } else if (optionConfig.values === 'multiple') {
        if (rest.length === 0) {
          exit(2, `Option ${first} expects at least one value, but received none`)
        }
        //Set the Value
        //Validate the value
        const { parsed, invalid } = validateTypes(optionConfig.type, rest)
        if (invalid.length > 0) {
          exit(
            2,
            `Option ${first} expects a valid ${optionConfig.type}, but received: ${invalid.join(', ')}`
          )
        }

        parsedArgs[matchingOption] = parsed
      } else {
        throw new Error(`Unrecognized option values ${optionConfig.values}`)
      }
    } else if (first.startsWith('-')) {
      if (rest.length > 0 && !isLast) {
        exit(2, `Boolean option(s) ${first} should not have values`)
        return {} as any
      } else if (isLast) {
        operands.push(...rest)
      }

      // Short options (-s, -spq)
      for (const char of first.slice(1)) {
        if (!(char in booleanOptions)) {
          exit(2, `Unknown flag: -${char}`)
        }
        const key = booleanOptions[char]
        parsedArgs[key] = true
      }
    }
  }

  if (numberOfSubcommands > 0 && additionalArgs?.requireSubcommand && !subcommand) {
    exit(2, `A subcommand is required`)
  }

  // Step 4: Return results
  return { args: parsedArgs, operands, command: subcommand as any, anyValues: args.length > 0 }
}

/**
 * Initialize the default values for arguments
 *
 * @param parsedArgs the parsed arguments to default the values in
 * @param cliOptions the configuration options for the CLI commands
 */
function initializeOptionDefaults<T extends Record<string, CliArgument>>(
  parsedArgs: any,
  booleanOptions: Record<string, string>,
  cliOptions: T
): any {
  for (const [key, option] of Object.entries(cliOptions)) {
    if (option.values === 'none') {
      parsedArgs[key] = false //(option as BooleanOption).default
      if (option.character) {
        booleanOptions[(option as BooleanArgument).character.toLowerCase()] = key
      }
    } else if (option.values === 'single') {
      parsedArgs[key] = undefined
    } else if (option.values === 'multiple') {
      parsedArgs[key] = []
    }
  }
}

/**
 * Parse environment variables and set the values in the parsed arguments.
 *
 * @param options the configuration options for the CLI commands
 * @param parsedArgs the parsed arguments to set the values in
 * @param env the environment variables to get values from
 * @param envPrefix the prefix to use for environment variables, if any
 */
function parseEnvironmentVariables(
  options: Record<string, CliArgument>,
  parsedArgs: any,
  env: Record<string, string | undefined>,
  envPrefix: string | undefined
): void {
  if (!envPrefix) {
    return
  }

  const prefix = envPrefix + '_'
  const envToKeys = Object.keys(options).reduce(
    (acc, key) => {
      acc[camelToCapitalSnakeCase(key)] = key
      return acc
    },
    {} as Record<string, string>
  )

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix)) {
      const optionKey = key.slice(prefix.length)
      const option = envToKeys[optionKey]
      if (option) {
        const config = options[option]
        if (isEnumOption(config)) {
          if (config.values === 'single') {
            const matchingValue = config.validValues.find(
              (v) => v.toLowerCase() === value!.toLowerCase()
            )
            if (!matchingValue) {
              exit(
                2,
                `Environment ${key} allows only the following values: ${config.validValues.join(', ')}`
              )
            }
            parsedArgs[option] = matchingValue
          } else if (config.values === 'multiple') {
            const invalidValues = []
            const validValues = []
            const values = value!.split(' ')
            for (const v of values) {
              const matchingValue = config.validValues.find(
                (valid) => valid.toLowerCase() === v.toLowerCase()
              )
              if (matchingValue) {
                validValues.push(matchingValue)
              } else {
                invalidValues.push(value)
              }
            }
            if (invalidValues.length > 0) {
              exit(
                2,
                `Environment ${key} allows only the following values: ${config.validValues.join(', ')}`
              )
            }
            parsedArgs[option] = validValues
          }
        } else if (config.values === 'none') {
          parsedArgs[option] = true
        } else if (config.values === 'single') {
          const { parsed, invalid } = validateTypes(config.type, value!)
          if (invalid.length > 0) {
            exit(
              2,
              `Environment ${key} expects a valid ${config.type}, but received: ${invalid.join(', ')}`
            )
          }
          parsedArgs[option] = parsed
        } else if (config.values === 'multiple') {
          const values = value!.split(' ')
          const { parsed, invalid } = validateTypes(config.type, values)
          if (invalid.length > 0) {
            exit(
              2,
              `Environment ${key} expects a valid ${config.type}, but received: ${invalid.join(', ')}`
            )
          }
          parsedArgs[option] = parsed
        }
      }
    }
  }
}

/**
 * Groups arguments into chunks based on the -- separator.
 *
 * @param args
 * @returns
 */
function groupArguments(args: string[]): ArgumentChunk[] {
  const grouped: ArgumentChunk[] = []
  let currentChunk: string[] = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--') {
      grouped.push({
        first: arg,
        rest: args.slice(i + 1),
        isFirst: grouped.length === 0,
        isLast: true
      })
      break
    }

    if (arg.startsWith('-') && currentChunk.length > 0) {
      grouped.push({
        first: currentChunk.at(0)!,
        rest: currentChunk.slice(1),
        isFirst: grouped.length === 0,
        isLast: false
      })
      currentChunk = []
    }
    currentChunk.push(arg)
  }

  if (currentChunk.length > 0) {
    grouped.push({
      first: currentChunk.at(0)!,
      rest: currentChunk.slice(1),
      isFirst: grouped.length === 0,
      isLast: true
    })
  }

  return grouped
}

/**
 * Validate the types of a standard argument
 *
 * @param type the type the argument accepts
 * @param values the values to validate
 * @returns an object with the invalid values and the parsed values
 */
function validateTypes(
  type: 'string' | 'number',
  values: string[] | string
): { invalid: string[]; parsed: string | string[] | number | number[] } {
  if (type === 'string') {
    return { invalid: [], parsed: values }
  }
  if (!Array.isArray(values)) {
    const isValid = !isNaN(Number(values))
    if (isValid) {
      return { invalid: [], parsed: Number(values) }
    }
    return { invalid: [values], parsed: 0 }
  }
  const invalid = values.filter((v) => isNaN(Number(v)))
  if (invalid.length > 0) {
    return { invalid, parsed: [] }
  }
  return { invalid: [], parsed: values.map(Number) }
}

function camelToCapitalSnakeCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore before capital letters
    .toUpperCase() // Convert to uppercase
}

function camelToKebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert underscore before capital letters
    .toLowerCase() // Convert to uppercase
}

export function printHelpContents<
  O extends Record<string, CliArgument>,
  C extends Record<string, Command>
>(
  command: string,
  subcommands: C,
  cliOptions: O,
  additionalArgs?: AdditionalCliArguments,
  selectedSubcommand?: string | undefined
): void {
  const operandsName = additionalArgs?.operandsName ?? 'operands'

  if (selectedSubcommand) {
    let usageString = `Usage: ${command} ${selectedSubcommand} [options] [flags] [--] [${operandsName}1] [${operandsName}2]`

    console.log(usageString)
    console.log(`\n${subcommands[selectedSubcommand].description}`)
    console.log(`${selectedSubcommand} Options:`)
    printOptions(subcommands[selectedSubcommand].options)
    console.log('')
  } else {
    let usageString = `Usage: ${command}`
    const subcommandKeys = Object.keys(subcommands)
    if (subcommandKeys.length > 0 && additionalArgs?.requireSubcommand) {
      usageString += ' <subcommand>'
    } else if (subcommandKeys.length > 0) {
      usageString += ' [subcommand]'
    }

    usageString += ` [options] [flags] [--] [${operandsName}1] [${operandsName}2]`

    console.log(usageString)

    const longestCommand = subcommandKeys.reduce((acc, cmd) => Math.max(acc, cmd.length), 0)

    if (subcommandKeys.length > 0) {
      console.log('Commands:')
      for (const cmd of subcommandKeys) {
        const description = subcommands[cmd].description
        console.log(`  ${(cmd + ':').padEnd(longestCommand + 1)} ${description}`)
      }
      console.log(`\n Use ${command} <subcommand> --help for more information about a subcommand`)
    }
  }

  console.log('Global Options:')
  const globalOptions: Record<string, CliArgument> = {
    ...cliOptions,
    ...({
      help: {
        description: 'Print the help contents and exit'
      }
    } as any)
  }
  if (additionalArgs?.version) {
    globalOptions['version'] = {
      description: 'Print the version and exit'
    } as any
  }

  printOptions(globalOptions)
}

function printOptions<O extends Record<string, CliArgument>, C extends Record<string, Command>>(
  cliOptions: Config<O>
): void {
  const longestOption =
    Object.keys(cliOptions).reduce(
      (acc, key) => Math.max(acc, camelToKebabCase(key).length + 2),
      0
    ) + 1

  const terminalWidth = process.stdout.columns ?? 80

  const nonBooleanBuffer = '     '
  for (const [key, option] of Object.entries(cliOptions)) {
    let optionString = `  --${camelToKebabCase(key)}:`.padEnd(longestOption + 3)
    if (isBooleanOption(option)) {
      optionString += `(-${option.character}) `
    } else {
      optionString += nonBooleanBuffer
    }
    const leftBar = optionString.length
    optionString += option.description + '. '
    if (isEnumOption(option)) {
      if (option.values === 'single') {
        optionString += `Must be one of: ${option.validValues.join(', ')}.`
      } else {
        optionString += `Valid values: ${option.validValues.join(', ')}.`
      }
    } else if (option.values === 'single') {
      optionString += `One ${option.type} required`
    } else if (option.values === 'multiple') {
      optionString += `Multiple ${option.type}s allowed`
    }

    console.log(optionString.slice(0, terminalWidth))
    let stringToPrint = optionString.slice(terminalWidth)
    const secondLineLength = terminalWidth - leftBar

    while (stringToPrint.length > 0) {
      console.log(' '.repeat(leftBar) + stringToPrint.slice(0, secondLineLength))
      stringToPrint = stringToPrint.slice(secondLineLength)
    }
  }
}

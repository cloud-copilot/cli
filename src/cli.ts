import { Argument } from './arguments/argument.js'
import { exit } from './utils.js'

type ParsedArguments<T extends Record<string, Argument<any>>> = {
  [K in keyof T as K]: T[K] extends Argument<infer V> ? V : never
}

/**
 * A subcommand that can be used in the CLI.
 */
export type Subcommand = {
  description: string
  arguments: Record<string, Argument<any>>
}

/**
 * A map of CLI argument keys to their configuration.
 */
export type Config<T extends Record<string, Argument<any>>> = T

interface ArgumentChunk {
  first: string
  rest: string[]
  isFirst: boolean
  isLast: boolean
}

interface ConsoleLogger {
  log: (...args: any[]) => void
}

/**
 * Additional arguments that can be used to configure the CLI parser.
 */
export interface AdditionalCliOptions {
  /**
   * The version of the CLI command. If provided, the CLI provides a --version flag that prints the version and exits.
   *
   * If a string is provided, it is printed as-is.
   * If an object it can have the following properties:
   * - currentVersion: the current version of the CLI. This can be a string or a function that returns a Promise<string> or string.
   * - checkForUpdates: Can be:
   *   - a string name of the npm package to check for updates
   *   - a function that returns a Promise<string | null> that returns the latest version or null if no update is available.
   * - updateMessage: a function that takes the current version and latest version and returns a string message to display when an update is available.
   */
  // version?: string
  version?:
    | string
    | {
        currentVersion: string | (() => Promise<string> | string)
        checkForUpdates?: string | (() => Promise<string | null>)
        updateMessage?: (current: string, latest: string) => string
      }

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

  /**
   * Expect operands. Whether the app expects operands. Defaults to true.
   *
   * Changes the help message to include operands.
   */
  expectOperands?: boolean

  /**
   * Allow operands from standard input. If true, the help will include a note about reading operands from standard input.
   *
   * Defaults to false
   */
  allowOperandsFromStdin?: boolean

  /**
   * A logger to use for printing help messages. If not provided, console.log is used.
   */
  consoleLogger?: ConsoleLogger
}

type OperandsType<A extends AdditionalCliOptions> = A extends { expectOperands: false }
  ? never
  : string[]

export type SelectedSubcommandWithArgs<
  C extends Record<string, Subcommand>,
  O extends Record<string, Argument<any>>,
  A extends AdditionalCliOptions
> = keyof C extends never
  ? {
      subcommand: never
      args: ParsedArguments<O>
      operands: OperandsType<A>
      anyValues: boolean
      printHelp: () => void
    }
  : A extends { requireSubcommand: true }
    ? {
        [K in keyof C]: {
          subcommand: K
          args: ParsedArguments<C[K]['arguments']> & ParsedArguments<O>
          operands: OperandsType<A>
          anyValues: boolean
          printHelp: () => void
        }
      }[keyof C]
    :
        | {
            subcommand: undefined
            args: ParsedArguments<O>
            operands: OperandsType<A>
            anyValues: boolean
            printHelp: () => void
          }
        | {
            [K in keyof C]: {
              subcommand: K
              args: ParsedArguments<C[K]['arguments']> & ParsedArguments<O>
              operands: OperandsType<A>
              anyValues: boolean
              printHelp: () => void
            }
          }[keyof C]

type Only<A, B> = {
  [K in keyof A]: K extends keyof B ? A[K] : never
} & Partial<B>

/**
 * Parse CLI Arguments and return the parsed typesafe results.
 *
 * @param command the name of the command arguments are being parsed for.
 * @param subcommands the list of subcommands that can be used, if any.
 * @param cliArgs the configuration options for the CLI command.
 * @param additionalOptions additional arguments to be used for parsing and displaying help.
 * @returns the parsed arguments, operands, and subcommand if applicable.
 */
export async function parseCliArguments<
  const O extends Record<string, Argument<any>>,
  const C extends Record<string, Subcommand>,
  const A extends AdditionalCliOptions
>(
  command: string,
  subcommands: C,
  cliArgs: Config<O>,
  additionalOptions?: Only<A, AdditionalCliOptions>
): Promise<SelectedSubcommandWithArgs<C, O, A>> {
  const args = additionalOptions?.args ?? process.argv.slice(2)
  const env = additionalOptions?.env ?? process.env
  const parsedArgs: any = {}
  const operands: string[] = []
  const booleanOptions: Record<string, string> = {}
  const subcommandKeys = Object.keys(subcommands)
  const numberOfSubcommands = subcommandKeys.length
  const combinedOptions: Record<string, Argument<any>> = { ...cliArgs }
  const logger = additionalOptions?.consoleLogger ?? console
  let subcommand: string | undefined
  const expectOperands = Object.hasOwn(additionalOptions || {}, 'expectOperands')
    ? !!additionalOptions?.expectOperands
    : true

  if (args.length === 0 && additionalOptions?.showHelpIfNoArgs) {
    printHelpContents(command, subcommands, cliArgs, additionalOptions)
    exit(0, undefined)
    return {} as any
  }

  const allDefaults = {}
  const isSetByCli: Record<string, boolean> = {}
  // Step 1: Initialize defaults
  const parsedEnvironmentArgs = {}
  initializeOptionDefaults(allDefaults, booleanOptions, cliArgs)

  // Step 2: Handle environment variables
  await parseEnvironmentVariables(
    cliArgs,
    parsedEnvironmentArgs,
    env,
    additionalOptions?.envPrefix,
    isSetByCli
  )

  // Step 3: Group arguments into objects
  const commandChunks = groupArguments(args)

  // Step 4: Validation and parsing arguments
  for (const { first, rest, isLast, isFirst } of commandChunks) {
    // Handle --help and --version
    if (first === '--help') {
      printHelpContents(command, subcommands, cliArgs, additionalOptions, subcommand)
      exit(0, undefined)
      return {} as any
    }

    if (first === '--version') {
      if (additionalOptions?.version) {
        await printVersion(additionalOptions.version, logger)
        exit(0, undefined)
        return {} as any
      }
    }

    // Handle commands if applicable
    if (isFirst && !first.startsWith('-')) {
      if (numberOfSubcommands === 0) {
        if (isLast) {
          operands.push(first, ...rest)
        } else {
          exit(2, `Invalid: ${first}, all arguments must specified using a --argument`)
        }
      } else {
        if (!isLast && rest.length > 0) {
          exit(2, `Arguments must be specified using a --argument, ${rest.join(' ')} is ambiguous`)
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
        const subcommandOptions = subcommands[subcommand].arguments
        initializeOptionDefaults(allDefaults, booleanOptions, subcommandOptions)
        await parseEnvironmentVariables(
          subcommandOptions,
          parsedEnvironmentArgs,
          env,
          additionalOptions?.envPrefix,
          isSetByCli
        )
        for (const [key, option] of Object.entries(subcommandOptions)) {
          combinedOptions[key] = option
        }
        operands.push(...rest)
      }
    }

    // Validate options
    if (first == '--') {
      if (!expectOperands) {
        exit(2, `Operands are not expected but '--' separator was used`)
      }
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
        //Look for an exact match, it's possible that one option name is the beginning of another
        const exactMatch = matchingOptions.find((k) => k.toLowerCase() === key)
        if (!exactMatch) {
          exit(2, `Ambiguous argument: ${first}`)
        }
        matchingOption = exactMatch
      } else {
        if ('--help'.startsWith(first)) {
          printHelpContents(command, subcommands, cliArgs, additionalOptions, subcommand)
          exit(0, undefined)
          return {} as any
        } else if ('--version'.startsWith(first) && additionalOptions?.version) {
          await printVersion(additionalOptions.version, logger)
          exit(0, undefined)
          return {} as any
        }
        exit(2, `Unknown argument: ${first}`)
      }

      if (!matchingOption) {
        exit(2, `Unknown argument: ${first}`)
        return {} as any
      }

      const selectedArgument = matchingOption!
      const fullArgumentName = `--${camelToKebabCase(selectedArgument)}`
      const optionConfig = combinedOptions[selectedArgument]
      initializeDefault(parsedArgs, combinedOptions, selectedArgument)
      if (optionConfig.present) {
        parsedArgs[selectedArgument] = await optionConfig.present(parsedArgs[selectedArgument])
      }

      if (rest.length > 0 && optionConfig.character) {
        if (!isLast) {
          exit(
            2,
            `Validation error for ${fullArgumentName}: does not accept values but received ${rest.join(', ')}`
          )
          return {} as any
        } else {
          // If we're at the last argument and there are values, check if operands are expected
          if (!expectOperands) {
            exit(
              2,
              `Validation error for ${fullArgumentName}: does not accept values but received ${rest.join(', ')}`
            )
            return {} as any
          } else {
            operands.push(...rest)
          }
        }
      } else {
        const acceptsMultiple = optionConfig.acceptMultipleValues
          ? optionConfig.acceptMultipleValues()
          : false

        let theRest = rest
        if (!acceptsMultiple && rest.length > 1) {
          if (isLast && expectOperands) {
            theRest = [rest[0]]
            operands.push(...rest.slice(1))
          }
        }

        const currentValue = parsedArgs[selectedArgument]
        const validation = await optionConfig.validateValues(
          currentValue,
          theRest,
          isSetByCli[selectedArgument] === undefined
        )
        if (!validation.valid) {
          exit(2, `Validation error for ${fullArgumentName}: ${validation.message}`)
          return {} as any
        } else {
          parsedArgs[selectedArgument] = await optionConfig.reduceValues(
            currentValue,
            validation.value,
            isSetByCli[selectedArgument] === undefined
          )
          isSetByCli[selectedArgument] = true
        }
      }
    } else if (first.startsWith('-')) {
      if (rest.length > 0 && !isLast) {
        exit(2, `Boolean flag(s) ${first} should not have values but received ${rest.join(', ')}`)
        return {} as any
      } else if (isLast && rest.length > 0) {
        // If we're at the last argument and there are values, check if operands are expected
        if (!expectOperands) {
          exit(2, `Boolean flag(s) ${first} should not have values but received ${rest.join(', ')}`)
          return {} as any
        } else {
          operands.push(...rest)
        }
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

  if (numberOfSubcommands > 0 && additionalOptions?.requireSubcommand && !subcommand) {
    exit(2, `A subcommand is required`)
  }

  // Step 5: Validate operands if expectOperands is false
  if (!expectOperands && operands.length > 0) {
    exit(2, `Operands are not expected but received: ${operands.join(', ')}`)
  }

  // Step 4: Return results
  return {
    args: { ...allDefaults, ...parsedEnvironmentArgs, ...parsedArgs },
    operands: expectOperands ? operands : ([] as never),
    subcommand: subcommand as keyof C extends never ? never : any,
    anyValues: args.length > 0,
    printHelp: () => {
      printHelpContents(command, subcommands, cliArgs, additionalOptions, subcommand)
    }
  } as SelectedSubcommandWithArgs<C, O, A>
}

/**
 * Initialize the default values for arguments.
 *
 * Will populate the parsedArgs object with default values from the cliArguments.
 * Will also populate the booleanOptions map with single character boolean options.
 *
 * @param parsedArgs the parsed arguments to default the values in
 * @param booleanOptions a map of single character boolean options to their full names
 * @param cliArguments the configuration options for the CLI commands
 */
function initializeOptionDefaults<T extends Record<string, Argument<any>>>(
  parsedArgs: any,
  booleanOptions: Record<string, string>,
  cliArguments: T
): any {
  for (const [key, option] of Object.entries(cliArguments)) {
    parsedArgs[key] = option.defaultValue
    if (option.character) {
      booleanOptions[option.character.toLowerCase()] = key
    }
  }
}

/**
 * Initialize the default value for a specific argument if it is not already set.
 *
 * If the argument is not already present in parsedArgs, it will be set to the default value from cliArguments.
 *
 * @param parsedArgs the parsed arguments so far.
 * @param cliArguments the CLI arguments configuration
 * @param key the specific argument key to initialize
 */
function initializeDefault<T extends Record<string, Argument<any>>>(
  parsedArgs: any,
  cliArguments: T,
  key: keyof T
) {
  if (!Object.hasOwn(parsedArgs, key)) {
    parsedArgs[key] = cliArguments[key].defaultValue
  }
}

/**
 * Parse environment variables and set the values in the parsed arguments.
 *
 * @param cliArguments the configuration options for the CLI commands
 * @param parsedArgs the parsed arguments to set the values in
 * @param env the environment variables to get values from
 * @param envPrefix the prefix to use for environment variables, if any
 */
async function parseEnvironmentVariables(
  cliArguments: Record<string, Argument<any>>,
  parsedArgs: any,
  env: Record<string, string | undefined>,
  envPrefix: string | undefined,
  valuesSetByCli: Record<string, boolean>
): Promise<void> {
  if (!envPrefix) {
    return
  }

  const prefix = envPrefix + '_'
  const envToKeys = Object.keys(cliArguments).reduce(
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
        const config = cliArguments[option]
        initializeDefault(parsedArgs, cliArguments, option)
        if (config.present) {
          parsedArgs[option] = await config.present(parsedArgs[option])
        }
        if (!config.character) {
          const values = value!.split(' ')
          const validation = await config.validateValues(
            parsedArgs[option],
            values,
            valuesSetByCli[option] === undefined
          )
          if (!validation.valid) {
            const s = values.length > 1 ? 's' : ''
            exit(2, `Invalid value${s} for environment ${key}: ${validation.message}`)
            return
          }
          parsedArgs[option] = await config.reduceValues(
            parsedArgs[option],
            validation.value,
            valuesSetByCli[option] === undefined
          )
          valuesSetByCli[option] = true
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

export function camelToCapitalSnakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // Insert underscore before capital letters
    .toUpperCase() // Convert to uppercase
}

export function camelToKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Insert dash before capital letters
    .toLowerCase() // Convert to lowercase
}

export function printHelpContents<
  O extends Record<string, Argument<any>>,
  C extends Record<string, Subcommand>
>(
  command: string,
  subcommands: C,
  cliOptions: O,
  additionalArgs?: AdditionalCliOptions,
  selectedSubcommand?: string | undefined
): void {
  const logger = additionalArgs?.consoleLogger ?? console
  const operandsExpected =
    additionalArgs?.expectOperands != undefined ? additionalArgs?.expectOperands : true
  const operandsName = additionalArgs?.operandsName ?? 'operand'
  const operandsString = operandsExpected ? ` [--] [${operandsName}1] [${operandsName}2]` : ''

  const anyGlobalFlags = Object.values(cliOptions).some((option) => option.character)

  if (selectedSubcommand) {
    const anyCommandFlags = Object.values(subcommands[selectedSubcommand].arguments).some(
      (option) => option.character
    )

    const flags = anyGlobalFlags || anyCommandFlags ? ' [flags]' : ''

    let usageString = `Usage: ${command} ${selectedSubcommand} [options]${flags}${operandsString}`
    if (additionalArgs?.allowOperandsFromStdin) {
      usageString += `\n       <${operandsName}s to stdout> | ${command} ${selectedSubcommand} [options]${flags}`
    }

    logger.log(usageString)
    logger.log('')
    logger.log(`${subcommands[selectedSubcommand].description}`)
    logger.log(`${selectedSubcommand} Options:`)
    printOptions(subcommands[selectedSubcommand].arguments, logger)
    logger.log('')
  } else {
    const anyCommandFlags = Object.values(subcommands).some((subcommand) =>
      Object.values(subcommand.arguments).some((option) => option.character)
    )

    const flags = anyGlobalFlags || anyCommandFlags ? ' [flags]' : ''

    let singleUseString = `${command}`
    const subcommandKeys = Object.keys(subcommands)
    if (subcommandKeys.length > 0 && additionalArgs?.requireSubcommand) {
      singleUseString += ' <subcommand>'
    } else if (subcommandKeys.length > 0) {
      singleUseString += ' [subcommand]'
    }

    singleUseString += ` [options]${flags}`
    let usageString = `Usage: ${singleUseString}${operandsString}`
    if (additionalArgs?.allowOperandsFromStdin) {
      usageString += `\n       <${operandsName}s to stdout> | ${singleUseString}`
    }

    logger.log(usageString)

    const longestCommand = subcommandKeys.reduce((acc, cmd) => Math.max(acc, cmd.length), 0)

    if (subcommandKeys.length > 0) {
      logger.log('Subcommands:')
      for (const cmd of subcommandKeys) {
        const description = subcommands[cmd].description
        logger.log(`  ${(cmd + ':').padEnd(longestCommand + 1)} ${description}`)
      }
      logger.log('')
      logger.log(` Use ${command} <subcommand> --help for more information about a subcommand`)
    }
  }

  logger.log('Global Options:')
  const globalOptions: Record<string, Argument<any>> = {
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

  printOptions(globalOptions, logger)
}

function printOptions<
  O extends Record<string, Argument<any>>,
  C extends Record<string, Subcommand>
>(cliOptions: Config<O>, logger: ConsoleLogger): void {
  const longestOption =
    Object.keys(cliOptions).reduce(
      (acc, key) => Math.max(acc, camelToKebabCase(key).length + 2),
      0
    ) + 1

  const terminalWidth = process.stdout.columns ?? 80

  const nonBooleanBuffer = '     '
  for (const [key, option] of Object.entries(cliOptions)) {
    let optionString = `  --${camelToKebabCase(key)}:`.padEnd(longestOption + 3)
    if (option.character) {
      optionString += `(-${option.character}) `
    } else {
      optionString += nonBooleanBuffer
    }
    const leftBar = optionString.length
    optionString += option.description

    logger.log(optionString.slice(0, terminalWidth))
    let stringToPrint = optionString.slice(terminalWidth)
    const secondLineLength = terminalWidth - leftBar

    while (stringToPrint.length > 0) {
      logger.log(' '.repeat(leftBar) + stringToPrint.slice(0, secondLineLength).trimStart())
      stringToPrint = stringToPrint.slice(secondLineLength)
    }
  }
}

async function printVersion(
  versionInfo: AdditionalCliOptions['version'],
  logger: ConsoleLogger
): Promise<void> {
  if (!versionInfo) {
    logger.log('Version information not available. This is a bug.')
    return
  }

  if (typeof versionInfo === 'string') {
    logger.log(versionInfo)
    return
  }

  let currentVersion: string | null = null
  if (typeof versionInfo.currentVersion === 'string') {
    currentVersion = versionInfo.currentVersion
  } else if (typeof versionInfo.currentVersion === 'function') {
    currentVersion = await versionInfo.currentVersion()
  }

  if (!currentVersion) {
    logger.log('Current version not available')
    return
  }

  let latestVersion: string | null = null
  if (typeof versionInfo.checkForUpdates == 'string') {
    latestVersion = await getLatestVersionFromNpm(versionInfo.checkForUpdates)
  } else if (typeof versionInfo.checkForUpdates === 'function') {
    latestVersion = await versionInfo.checkForUpdates()
  }

  let updateMessage: string | undefined = undefined
  if (currentVersion && latestVersion && currentVersion !== latestVersion) {
    if (versionInfo.updateMessage) {
      updateMessage = versionInfo.updateMessage(currentVersion, latestVersion)
    } else if (typeof versionInfo.checkForUpdates === 'string') {
      updateMessage = `Latest: ${latestVersion}. To update run: npm update -g ${versionInfo.checkForUpdates}`
    } else {
      updateMessage = `Latest: ${latestVersion}.`
    }
  } else if (currentVersion && latestVersion && currentVersion === latestVersion) {
    // updateMessage = 'You are using the latest version.'
  }

  logger.log(currentVersion)
  if (updateMessage) {
    logger.log(updateMessage)
  }
}

/**
 * Fetch the latest version of a package from the npm registry.
 *
 * @param packageName the name of the npm package to check, e.g. "my-cli-tool" or "@my-org/my-cli-tool"
 * @returns the latest version of the package published on npm or null if any error occurs
 */
async function getLatestVersionFromNpm(packageName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`)
    if (res.ok) {
      const data = await res.json()
      return data.version || null
    }
  } catch (e) {
    // Ignore errors fetching latest version
  }
  return null
}

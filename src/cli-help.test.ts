import { describe, expect, it, vi } from 'vitest'
import { Argument } from './arguments/argument.js'
import { booleanArgument } from './arguments/booleanArgument.js'
import { enumArgument } from './arguments/enumArgument.js'
import { singleValueArgument } from './arguments/singleValueArgument.js'
import { stringArgument } from './arguments/stringArguments.js'
import { AdditionalCliOptions, Subcommand, parseCliArguments } from './cli.js'
import { FakeLogger } from './cli.test.js'
import { exit } from './utils.js'
vi.mock('./utils.js')

interface CliHelpTest {
  name: string
  only?: true
  command?: string
  subcommands?: Record<string, Subcommand>
  args?: Record<string, Argument<any>>
  additionalArgs?: AdditionalCliOptions
  selectedSubcommand?: string

  expected: {
    helpText: string[]
  }
}

const cliHelpTests: CliHelpTest[] = [
  //Add Tests here
  {
    name: 'basic help with no subcommands or arguments',
    command: 'myapp',
    expected: {
      helpText: [
        'Usage: myapp [options] [--] [operand1] [operand2]',
        'Global Options:',
        '  --help:      Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with version option',
    command: 'myapp',
    additionalArgs: {
      version: '1.0.0'
    },
    expected: {
      helpText: [
        'Usage: myapp [options] [--] [operand1] [operand2]',
        'Global Options:',
        '  --help:         Print the help contents and exit',
        '  --version:      Print the version and exit'
      ]
    }
  },
  {
    name: 'help with custom string arguments',
    command: 'myapp',
    args: {
      name: stringArgument({
        description: 'Your name'
      }),
      output: stringArgument({
        description: 'Output file path',
        defaultValue: 'output.txt'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp [options] [--] [operand1] [operand2]',
        'Global Options:',
        '  --name:        Your name. One string required.',
        '  --output:      Output file path. One string required.',
        '  --help:        Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with boolean flags',
    command: 'myapp',
    args: {
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      }),
      force: booleanArgument({
        description: 'Force operation',
        character: 'f'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp [options] [flags] [--] [operand1] [operand2]',
        'Global Options:',
        '  --verbose: (-v) Enable verbose output',
        '  --force:   (-f) Force operation',
        '  --help:         Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with custom date argument',
    command: 'myapp',
    args: {
      startDate: singleValueArgument<Date>(async (rawValue) => {
        const date = new Date(rawValue)
        if (isNaN(date.getTime())) {
          return { valid: false, message: 'Invalid date format' }
        }
        return { valid: true, value: date }
      })({
        description: 'Start date for processing'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp [options] [--] [operand1] [operand2]',
        'Global Options:',
        '  --start-date:      Start date for processing',
        '  --help:            Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with subcommands',
    command: 'myapp',
    subcommands: {
      build: {
        description: 'Build the project',
        arguments: {
          target: stringArgument({
            description: 'Build target'
          })
        }
      },
      test: {
        description: 'Run tests',
        arguments: {
          coverage: booleanArgument({
            description: 'Generate coverage report',
            character: 'c'
          })
        }
      }
    },
    args: {
      config: stringArgument({
        description: 'Configuration file path'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp [subcommand] [options] [flags] [--] [operand1] [operand2]',
        'Subcommands:',
        '  build: Build the project',
        '  test:  Run tests',
        '',
        ' Use myapp <subcommand> --help for more information about a subcommand',
        'Global Options:',
        '  --config:      Configuration file path. One string required.',
        '  --help:        Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help for specific subcommand',
    command: 'myapp',
    selectedSubcommand: 'build',
    subcommands: {
      build: {
        description: 'Build the project with specified options',
        arguments: {
          target: stringArgument({
            description: 'Build target (e.g., debug, release)'
          }),
          parallel: booleanArgument({
            description: 'Enable parallel builds',
            character: 'p'
          })
        }
      }
    },
    args: {
      config: stringArgument({
        description: 'Configuration file path'
      }),
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp build [options] [flags] [--] [operand1] [operand2]',
        '',
        'Build the project with specified options',
        'build Options:',
        '  --target:        Build target (e.g., debug, release). One string required.',
        '  --parallel: (-p) Enable parallel builds',

        '',
        'Global Options:',
        '  --config:       Configuration file path. One string required.',
        '  --verbose: (-v) Enable verbose output',
        '  --help:         Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with no operands expected',
    command: 'myapp',
    additionalArgs: {
      expectOperands: false
    },
    args: {
      input: stringArgument({
        description: 'Input file'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp [options]',
        'Global Options:',
        '  --input:      Input file. One string required.',
        '  --help:       Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with custom operands name',
    command: 'myapp',
    additionalArgs: {
      operandsName: 'file'
    },
    expected: {
      helpText: [
        'Usage: myapp [options] [--] [file1] [file2]',
        'Global Options:',
        '  --help:      Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with required subcommand',
    command: 'myapp',
    additionalArgs: {
      requireSubcommand: true
    },
    subcommands: {
      build: {
        description: 'Build the project',
        arguments: {
          target: stringArgument({
            description: 'Build target'
          })
        }
      },
      test: {
        description: 'Run tests',
        arguments: {
          coverage: booleanArgument({
            description: 'Generate coverage report',
            character: 'c'
          })
        }
      }
    },
    args: {
      config: stringArgument({
        description: 'Configuration file path'
      })
    },
    expected: {
      helpText: [
        'Usage: myapp <subcommand> [options] [flags] [--] [operand1] [operand2]',
        'Subcommands:',
        '  build: Build the project',
        '  test:  Run tests',
        '',
        ' Use myapp <subcommand> --help for more information about a subcommand',
        'Global Options:',
        '  --config:      Configuration file path. One string required.',
        '  --help:        Print the help contents and exit'
      ]
    }
  },
  {
    name: 'help with long description that wraps',
    command: 'myapp',
    args: {
      logLevel: enumArgument({
        description:
          'Set the logging level for the application. This controls how much detail is included in the log output and can be very useful for debugging complex issues in production environments where you need detailed information about what the application is doing',
        validValues: ['debug', 'info', 'warn', 'error']
      })
    },
    expected: {
      helpText: [
        'Usage: myapp [options] [--] [operand1] [operand2]',
        'Global Options:',
        '  --log-level:      Set the logging level for the application. This controls how',
        '                    much detail is included in the log output and can be very u',
        '                    seful for debugging complex issues in production environment',
        '                    s where you need detailed information about what the applica',
        '                    tion is doing. One value required, valid values are: debug, ',
        '                    info, warn, error',
        '  --help:           Print the help contents and exit'
      ]
    }
  }
]

class FakeLogger {
  logs: string[] = []
  log(message: string) {
    this.logs.push(message)
  }
}

describe('CLI Help', () => {
  for (const test of cliHelpTests) {
    const func = test.only ? it.only : it

    func(test.name, async () => {
      const fakeExit = vi.mocked(exit)
      fakeExit.mockReset()
      const inMemoryLogger = new FakeLogger()

      const result = await parseCliArguments(
        test.command ?? 'test',
        test.subcommands ?? {},
        test.args ?? {},
        {
          ...test.additionalArgs,
          consoleLogger: inMemoryLogger,
          args: test.selectedSubcommand ? [test.selectedSubcommand, '--help'] : ['--help']
        }
      )
      // console.log(inMemoryLogger.logs.join('\n'))
      expect(inMemoryLogger.logs).toEqual(test.expected.helpText)
    })
  }
})

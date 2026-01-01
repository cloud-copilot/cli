import { describe, expect, it, vi } from 'vitest'
import { Argument } from './arguments/argument.js'
import { booleanArgument } from './arguments/booleanArgument.js'
import { enumArgument } from './arguments/enumArgument.js'
import { enumArrayArgument } from './arguments/enumArrayArgument.js'
import { mapArgument } from './arguments/mapArgument.js'
import { numberArgument, numberArrayArgument } from './arguments/numberArguments.js'
import { stringArgument, stringArrayArgument } from './arguments/stringArguments.js'
import {
  AdditionalCliOptions,
  Subcommand,
  camelToCapitalSnakeCase,
  camelToKebabCase,
  parseCliArguments
} from './cli.js'
import { exit } from './utils.js'
vi.mock('./utils.js')

interface ParseCliArgumentsTest {
  name: string
  only?: true
  subcommands?: Record<string, Subcommand>
  args?: Record<string, Argument<any>>
  additionalArgs?: AdditionalCliOptions

  expected: {
    operands?: string[]
    args?: Record<
      string,
      string | string[] | number | number[] | boolean | Record<string, string[]>
    >
    command?: string
    exit?: { code: number; message?: string }
    anyValues?: boolean
    console?: string[]
  }
}

const parseCliArgumentsTests: ParseCliArgumentsTest[] = [
  {
    name: 'no arguments',
    expected: {
      anyValues: false
    }
  },
  {
    name: 'no arguments with show help defaulted',
    additionalArgs: { showHelpIfNoArgs: true },
    expected: {
      exit: { code: 0 }
    }
  },
  {
    name: 'no options or commands',
    additionalArgs: { args: ['arg1', 'arg2', 'arg3'] },
    expected: {
      operands: ['arg1', 'arg2', 'arg3'],
      anyValues: true
    }
  },
  {
    name: 'commands with operands',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      },
      download: {
        description: 'Download a file',
        arguments: {}
      }
    },
    additionalArgs: { args: ['init', 'arg1', 'arg2'] },
    expected: {
      operands: ['arg1', 'arg2'],
      command: 'init'
    }
  },
  {
    name: 'command partial matching',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      },
      download: {
        description: 'Download a file',
        arguments: {}
      }
    },
    additionalArgs: { args: ['i', 'arg1', 'arg2'] },
    expected: {
      operands: ['arg1', 'arg2'],
      command: 'init'
    }
  },
  {
    name: 'ambiguous command',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      },
      inspect: {
        description: 'Download a file',
        arguments: {}
      }
    },
    additionalArgs: { args: ['i', 'arg1', 'arg2'] },
    expected: {
      exit: { code: 2, message: 'Ambiguous command: i' }
    }
  },
  {
    name: 'unrecognized command',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      },
      download: {
        description: 'Download a file',
        arguments: {}
      }
    },
    additionalArgs: { args: ['foo', 'arg1', 'arg2'] },
    expected: {
      exit: { code: 2, message: 'Unknown command: foo' }
    }
  },
  {
    name: 'convert camelcase to kebabcase',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1']
    },
    expected: {
      args: {
        fooBar: 'arg1'
      }
    }
  },
  {
    name: 'convert camelcase to kebabcase with multiple args',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', 'arg2']
    },
    expected: {
      args: {
        fooBar: ['arg1', 'arg2']
      }
    }
  },
  {
    name: 'make extra arguments operands',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', 'arg2']
    },
    expected: {
      args: {
        fooBar: 'arg1'
      },
      operands: ['arg2']
    }
  },
  {
    name: 'multiple value arguments should default to an empty array if specified',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option',
        defaultValue: []
      })
    },
    additionalArgs: {
      args: ['arg2']
    },
    expected: {
      args: {
        fooBar: []
      },
      operands: ['arg2']
    }
  },
  {
    name: 'multiple value arguments should append if defined multiple times',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option',
        defaultValue: []
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', '--foo-bar', 'arg2', 'arg3']
    },
    expected: {
      args: {
        fooBar: ['arg1', 'arg2', 'arg3']
      }
    }
  },
  {
    name: 'fail if too many arguments to a single value option',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      }),
      bazBang: stringArgument({
        description: 'A baz'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', 'arg2', '--baz-bang', 'arg3']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: expects a single value but received arg1, arg2'
      }
    }
  },
  {
    name: 'fail if no arguments to a single value option',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option',
        values: 'single'
      }),
      bazBang: stringArgument({
        description: 'A baz',
        values: 'single'
      })
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: a value is required'
      }
    }
  },
  {
    name: 'show full option name in error message',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option',
        values: 'single'
      }),
      bazBang: stringArgument({
        description: 'A baz',
        values: 'single'
      })
    },
    additionalArgs: {
      args: ['--foo-b']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: a value is required'
      }
    }
  },
  {
    name: 'fail if a single value option is specified multiple times',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', '--foo-bar', 'arg2']
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Validation error for --foo-bar: expects a single values but was set multiple times'
      }
    }
  },
  {
    name: 'string array with defautlt value and no arguments provided',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option',
        defaultValue: ['default1', 'default2']
      })
    },
    additionalArgs: {
      args: []
    },
    expected: {
      args: {
        fooBar: ['default1', 'default2']
      }
    }
  },
  {
    name: 'string array with default value and arguments provided',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option',
        defaultValue: ['default1', 'default2']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', 'arg2']
    },
    expected: {
      args: {
        fooBar: ['arg1', 'arg2']
      }
    }
  },
  {
    name: 'fail if a boolean option has a value',
    args: {
      doStuff: booleanArgument({ description: 'A foo bar option', character: 'd' }),
      bazBang: stringArgument({ description: 'A baz' })
    },
    additionalArgs: { args: ['--do-stuff', 'arg1', 'arg2', '--baz-bang', 'arg3'] },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --do-stuff: does not accept values but received arg1, arg2'
      }
    }
  },
  {
    name: 'if boolean is last put following arguments as operands',
    args: {
      doStuff: booleanArgument({ description: 'A foo bar option', character: 'd' }),
      bazBang: stringArgument({ description: 'A baz' })
    },
    additionalArgs: {
      args: ['--baz-bang', 'arg3', '--do-stuff', 'arg1', 'arg2']
    },
    expected: {
      args: {
        bazBang: 'arg3',
        doStuff: true
      },
      operands: ['arg1', 'arg2']
    }
  },
  {
    name: 'fail if multi value option has no values',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option',
        defaultValue: []
      })
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: at least one value is required'
      }
    }
  },
  {
    name: 'no command invalid command when followed by an option',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['hello', '--foo-bar', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Invalid: hello, all arguments must specified using a --argument'
      }
    }
  },
  {
    name: 'has commands but invalid command provided',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      },
      download: {
        description: 'Download a file',
        arguments: {}
      }
    },
    additionalArgs: { args: ['foo', '--foo-bar', 'arg1'] },
    expected: {
      exit: {
        code: 2,
        message: 'Unknown command: foo'
      }
    }
  },
  {
    name: 'command with unspecified options',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      }
    },
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['init', 'arg1', '--foo-bar', 'arg2']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Arguments must be specified using a --argument, arg1 is ambiguous'
      }
    }
  },
  {
    name: 'argument partial matching',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      }),
      barFoo: stringArgument({
        description: 'A bar foo option'
      })
    },
    additionalArgs: {
      args: ['--f', 'arg1']
    },
    expected: {
      args: {
        fooBar: 'arg1'
      }
    }
  },
  {
    name: 'one option is the beginning of another option',
    args: {
      resource: stringArgument({
        description: 'the resource'
      }),
      resourceAccountId: stringArgument({
        description: 'the resource account id'
      })
    },
    additionalArgs: {
      args: ['--resource', 'arg1']
    },
    expected: {
      args: {
        resource: 'arg1'
      }
    }
  },
  {
    name: 'ambiguous argument',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      }),
      fooBaz: stringArgument({
        description: 'A foo baz option'
      })
    },
    additionalArgs: {
      args: ['--f', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Ambiguous argument: --f'
      }
    }
  },
  {
    name: 'single number value is parsed',
    args: {
      fooBar: numberArgument({ description: 'A foo bar number' })
    },
    additionalArgs: {
      args: ['--foo-bar', '123']
    },
    expected: {
      args: {
        fooBar: 123
      }
    }
  },
  {
    name: 'invalid number value',
    args: {
      fooBar: numberArgument({ description: 'A foo bar number' })
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: expects a number but received arg1'
      }
    }
  },
  {
    name: 'multiple number values are parsed',
    args: {
      fooBar: numberArrayArgument({
        description: 'A foo bar number array'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', '123', '456']
    },
    expected: {
      args: {
        fooBar: [123, 456]
      }
    }
  },
  {
    name: 'some number values are invalid',
    args: {
      fooBar: numberArrayArgument({
        description: 'A foo bar number array'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', '123', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: expects a number but received arg1'
      }
    }
  },
  {
    name: 'all values after -- are operands',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--', 'arg1', 'arg2', '--foo-bar', 'arg3']
    },
    expected: {
      operands: ['arg1', 'arg2', '--foo-bar', 'arg3']
    }
  },
  {
    name: 'single dash boolean values should be true',
    args: {
      fooBar: booleanArgument({ character: 'f', description: 'A foo bar option' }),
      bazBang: booleanArgument({ character: 'b', description: 'baz bang' }),
      beepBoop: booleanArgument({ character: 'c', description: 'beep boop' })
    },
    additionalArgs: {
      args: ['-f', '-b']
    },
    expected: {
      args: {
        fooBar: true,
        bazBang: true,
        beepBoop: false
      }
    }
  },
  {
    name: 'dash boolean values can be combined',
    args: {
      fooBar: booleanArgument({ character: 'f', description: 'A foo bar option' }),
      bazBang: booleanArgument({ character: 'b', description: 'baz bang' }),
      beepBoop: booleanArgument({ character: 'c', description: 'beep boop' })
    },
    additionalArgs: {
      args: ['-fb', 'hello']
    },
    expected: {
      args: {
        fooBar: true,
        bazBang: true,
        beepBoop: false
      },
      operands: ['hello']
    }
  },
  {
    name: 'single dash booleans cannot have arguments',
    args: {
      fooBar: booleanArgument({ character: 'f', description: 'A foo bar option' }),
      bazBar: stringArgument({ description: 'A baz bar option' })
    },
    additionalArgs: {
      args: ['-f', 'arg1', '--barBaz']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Boolean flag(s) -f should not have values but received arg1'
      }
    }
  },
  {
    name: 'unrecognized single dash boolean',
    args: {
      fooBar: booleanArgument({ character: 'f', description: 'A foo bar option' })
    },
    additionalArgs: {
      args: ['-fx', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Unknown flag: -x'
      }
    }
  },
  {
    name: 'single dash booleans followed by another argument',
    args: {
      fooBar: booleanArgument({ character: 'f', description: 'A foo bar option' }),
      barBaz: stringArgument({ description: 'A bar baz option' })
    },
    additionalArgs: {
      args: ['-f', '--barBaz', 'arg1']
    },
    expected: {
      args: {
        fooBar: true,
        barBaz: 'arg1'
      }
    }
  },
  {
    name: 'should print a version if a version flag is provided',
    additionalArgs: {
      args: ['--version'],
      version: '1.0.0'
    },
    expected: {
      exit: {
        code: 0
      },
      console: ['1.0.0']
    }
  },
  {
    name: 'should fail if there is no version but the version flag is provided',
    additionalArgs: {
      args: ['--version']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Unknown argument: --version'
      }
    }
  },
  {
    name: 'boolean environment variable always true',
    args: {
      fooBar: booleanArgument({ character: 's', description: 'A foo bar option' })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'true'
      }
    },

    expected: {
      args: {
        fooBar: true
      }
    }
  },
  {
    name: 'single value environment variable',
    args: {
      fooBar: stringArgument({ description: 'A foo bar option' })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'hello'
      }
    },

    expected: {
      args: {
        fooBar: 'hello'
      }
    }
  },
  {
    name: 'single value number environment variable',
    args: {
      fooBar: numberArgument({ description: 'A foo bar option' })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: '123'
      }
    },
    expected: {
      args: {
        fooBar: 123
      }
    }
  },
  {
    name: 'single value number invalid environment variable',
    args: {
      fooBar: numberArgument({ description: 'A foo bar option' })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'hello'
      }
    },

    expected: {
      exit: {
        code: 2,
        message: 'Invalid value for environment DAVE_FOO_BAR: expects a number but received hello'
      }
    }
  },
  {
    name: 'multiple value string environment variable',
    args: {
      fooBar: stringArrayArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'hello world'
      }
    },
    expected: {
      args: {
        fooBar: ['hello', 'world']
      }
    }
  },
  {
    name: 'multiple value number environment variable',
    args: {
      fooBar: numberArrayArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: '123 456'
      }
    },
    expected: {
      args: {
        fooBar: [123, 456]
      }
    }
  },
  {
    name: 'multiple value number invalid environment variable',
    args: {
      fooBar: numberArrayArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: '123 hello'
      }
    },
    expected: {
      exit: {
        code: 2,
        message: 'Invalid values for environment DAVE_FOO_BAR: expects a number but received hello'
      }
    }
  },
  {
    name: 'should ignore environment variables with the wrong prefix',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        NOT_DAVE_FOO_BAR: 'hello'
      }
    },
    expected: {
      anyValues: false
    }
  },
  {
    name: 'command line arguments should take precedence over environment variables',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'world'],
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'hello'
      }
    },
    expected: {
      args: {
        fooBar: 'world'
      }
    }
  },
  {
    name: 'single enum value no value provided',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: a value is required'
      }
    }
  },
  {
    name: 'single enum value is parsed',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'BETA']
    },
    expected: {
      args: {
        fooBar: 'beta'
      }
    }
  },
  {
    name: 'single enum value with default',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie'],
        defaultValue: 'alpha'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'charlie']
    },
    expected: {
      args: {
        fooBar: 'charlie'
      }
    }
  },
  {
    name: 'string value with default',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option',
        defaultValue: 'hello'
      })
    },
    additionalArgs: {
      args: []
    },
    expected: {
      args: {
        fooBar: 'hello'
      }
    }
  },
  {
    name: 'string value with default and override',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option',
        defaultValue: 'hello'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'goodbye']
    },
    expected: {
      args: {
        fooBar: 'goodbye'
      }
    }
  },
  {
    name: 'single enum value invalid value',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'delta']
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Validation error for --foo-bar: delta is not one of the allowed values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'single enum option with multiple values',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      }),
      bangBaz: stringArgument({
        description: 'bang baz'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'BETA', 'charlie', '--bang-baz', 'hello']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: expects a single value but received BETA, charlie'
      }
    }
  },
  {
    name: 'single enum specified multiple times',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'beta', '--foo-bar', 'charlie']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: expects a single value but was set multiple times'
      }
    }
  },
  {
    name: 'single enum environment variable with multiple values at end',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      }),
      bangBaz: stringArgument({
        description: 'bang baz'
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      args: ['--foo-bar', 'alpha', 'world']
    },
    expected: {
      args: {
        fooBar: 'alpha'
      },
      operands: ['world']
    }
  },
  {
    name: 'multiple enum values no values provided',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: At least one value is required'
      }
    }
  },
  {
    name: 'array enum values are parsed',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'BETA', 'charlie']
    },
    expected: {
      args: {
        fooBar: ['beta', 'charlie']
      }
    }
  },
  {
    name: 'array enum values specified multiple times',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'beta', 'alpha', '--foo-bar', 'charlie']
    },
    expected: {
      args: {
        fooBar: ['beta', 'alpha', 'charlie']
      }
    }
  },
  {
    name: 'multiple enum values some invalid',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'BETA', 'charlie', 'Echo']
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Validation error for --foo-bar: Echo is not one of the allowed values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'enum array with defaults and arguments provided',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie', 'delta'],
        defaultValue: ['alpha']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'delta']
    },
    expected: {
      args: {
        fooBar: ['delta']
      }
    }
  },
  {
    name: 'enum array with defaults and arguments provided as a superset of defaults',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie', 'delta'],
        defaultValue: ['alpha']
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'alpha', 'delta']
    },
    expected: {
      args: {
        fooBar: ['alpha', 'delta']
      }
    }
  },
  {
    name: 'enum environment variable, single value, valid',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'BETA'
      }
    },
    expected: {
      args: {
        fooBar: 'beta'
      }
    }
  },
  {
    name: 'enum environment variable, single value, invalid',
    args: {
      fooBar: enumArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'delta'
      }
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Invalid value for environment DAVE_FOO_BAR: delta is not one of the allowed values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'enum environment variable, multiple value, valid',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'BETA CHARLIE'
      }
    },
    expected: {
      args: {
        fooBar: ['beta', 'charlie']
      }
    }
  },
  {
    name: 'enum environment variable, multiple value, some invalid',
    args: {
      fooBar: enumArrayArgument({
        description: 'A foo bar option',
        validValues: ['alpha', 'beta', 'charlie']
      })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'BETA CHARLIE delta'
      }
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Invalid values for environment DAVE_FOO_BAR: delta is not one of the allowed values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'map argument',
    args: {
      fooBar: mapArgument({
        description: 'A foo bar map option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'key1', 'value1', 'value2', '--foo-bar', 'key2', 'value3']
    },
    expected: {
      args: {
        fooBar: {
          key1: ['value1', 'value2'],
          key2: ['value3']
        }
      }
    }
  },
  {
    name: 'map argument without a value',
    args: {
      fooBar: mapArgument({
        description: 'A foo bar map option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'key1', '--foo-bar', 'key2', 'value3']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: key1 requires at least one value'
      }
    }
  },
  {
    name: 'map argument without a key',
    args: {
      fooBar: mapArgument({
        description: 'A foo bar map option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Validation error for --foo-bar: a key is required and at least one value is required'
      }
    }
  },
  {
    name: 'map argument set same keys multiple times',
    args: {
      fooBar: mapArgument({
        description: 'A foo bar map option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'key1', 'value1', '--foo-bar', 'key1', 'value2']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --foo-bar: key1 is set multiple times'
      }
    }
  },
  {
    name: 'map argument with default value and no override',
    args: {
      fooBar: mapArgument({
        description: 'A foo bar map option',
        defaultValue: {
          key1: ['default1', 'default2'],
          key2: ['default3']
        }
      })
    },
    additionalArgs: {
      args: []
    },
    expected: {
      args: {
        fooBar: {
          key1: ['default1', 'default2'],
          key2: ['default3']
        }
      }
    }
  },
  {
    name: 'map argument with default value and overrides provided',
    args: {
      fooBar: mapArgument({
        description: 'A foo bar map option',
        defaultValue: {
          key1: ['default1', 'default2'],
          key2: ['default3']
        }
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'key1', 'override1', '--foo-bar', 'key2', 'override2']
    },
    expected: {
      args: {
        fooBar: {
          key1: ['override1'],
          key2: ['override2']
        }
      }
    }
  },
  {
    name: 'fail if a sub command is required but not provided',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      },
      download: {
        description: 'Download a file',
        arguments: {}
      }
    },
    additionalArgs: {
      requireSubcommand: true
    },
    expected: {
      exit: {
        code: 2,
        message: 'A subcommand is required'
      }
    }
  },
  // Subcommand specific arguments
  {
    name: 'should allow subcommand specific arguments and options',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {
          fooBar: stringArgument({ description: 'A foo bar option' })
        }
      }
    },
    args: {
      bazBang: stringArgument({ description: 'A baz bing option' })
    },
    additionalArgs: {
      args: ['init', '--foo-bar', 'arg1', '--baz-bang', 'arg2']
    },
    expected: {
      command: 'init',
      args: {
        fooBar: 'arg1',
        bazBang: 'arg2'
      }
    }
  },
  {
    name: 'should throw an error for subcommand specific options when using a different command',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {
          fooBar: stringArgument({ description: 'A foo bar option' })
        }
      },
      download: {
        description: 'Initialize the project',
        arguments: {}
      }
    },
    args: {
      bazBang: stringArgument({ description: 'baz bang', values: 'single' })
    },
    additionalArgs: {
      args: ['download', '--foo-bar', 'arg1', '--baz-bang', 'arg2']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Unknown argument: --foo-bar'
      }
    }
  },
  {
    name: 'should get subcommand specific environment variables',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {
          fooBar: stringArgument({ description: 'A foo bar option' })
        }
      }
    },
    args: {
      bazBang: stringArgument({ description: 'baz bang', values: 'single' })
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'arg1',
        DAVE_BAZ_BANG: 'arg2'
      },
      args: ['init']
    },
    expected: {
      command: 'init',
      args: {
        fooBar: 'arg1',
        bazBang: 'arg2'
      }
    }
  },
  {
    name: 'should exit if --help is provided',
    additionalArgs: {
      args: ['--help']
    },
    expected: {
      exit: {
        code: 0 // message is not checked
      }
    }
  },
  {
    name: 'should error if operands provided when expectOperands is false',
    additionalArgs: {
      args: ['arg1', 'arg2'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message: 'Operands are not expected but received: arg1, arg2'
      }
    }
  },
  {
    name: 'should error if -- separator used when expectOperands is false',
    additionalArgs: {
      args: ['--', 'arg1', 'arg2'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message: `Operands are not expected but '--' separator was used`
      }
    }
  },
  {
    name: 'should error if operands provided after single value argument when expectOperands is false',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'value1', 'operand1', 'operand2'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Validation error for --foo-bar: expects a single value but received value1, operand1, operand2'
      }
    }
  },
  {
    name: 'should error if multiple values provided to single value argument when expectOperands is false',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'value1', 'value2'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message:
          'Validation error for --foo-bar: expects a single value but received value1, value2'
      }
    }
  },
  {
    name: 'should error if operands provided with boolean flag when expectOperands is false',
    args: {
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      })
    },
    additionalArgs: {
      args: ['--verbose', 'operand1'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message: 'Validation error for --verbose: does not accept values but received operand1'
      }
    }
  },
  {
    name: 'should error if operands provided with subcommand when expectOperands is false',
    subcommands: {
      init: {
        description: 'Initialize the project',
        arguments: {}
      }
    },
    additionalArgs: {
      args: ['init', 'operand1', 'operand2'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message: 'Operands are not expected but received: operand1, operand2'
      }
    }
  },
  {
    name: 'should allow no operands when expectOperands is false',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'value'],
      expectOperands: false
    },
    expected: {
      args: {
        fooBar: 'value'
      },
      operands: []
    }
  },
  {
    name: 'should allow operands when expectOperands is true (default)',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'value', 'operand1'],
      expectOperands: true
    },
    expected: {
      args: {
        fooBar: 'value'
      },
      operands: ['operand1']
    }
  },
  {
    name: 'should allow operands when expectOperands is not specified (defaults to true)',
    args: {
      fooBar: stringArgument({
        description: 'A foo bar option'
      })
    },
    additionalArgs: {
      args: ['--foo-bar', 'value', 'operand1']
    },
    expected: {
      args: {
        fooBar: 'value'
      },
      operands: ['operand1']
    }
  },
  {
    name: 'should error if short boolean flag has values when expectOperands is false',
    args: {
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      })
    },
    additionalArgs: {
      args: ['-v', 'operand1'],
      expectOperands: false
    },
    expected: {
      exit: {
        code: 2,
        message: 'Boolean flag(s) -v should not have values but received operand1'
      }
    }
  },
  {
    name: 'should allow operands when expectOperands is true (default) with short boolean flag',
    args: {
      verbose: booleanArgument({
        description: 'Enable verbose output',
        character: 'v'
      })
    },
    additionalArgs: {
      args: ['-v', 'operand1']
    },
    expected: {
      args: {
        verbose: true
      },
      operands: ['operand1']
    }
  }
]

class FakeLogger {
  logs: string[] = []
  log(message: string) {
    this.logs.push(message)
  }
}

describe('parseCliArguments', () => {
  for (const test of parseCliArgumentsTests) {
    const func = test.only ? it.only : it
    func(test.name, async () => {
      //Given a list of arguments
      //When the arguments are parsed

      const fakeExit = vi.mocked(exit)
      fakeExit.mockReset()

      const inMemoryLogger = new FakeLogger()

      const commands = test.subcommands || {}
      const result = await parseCliArguments('myutil', commands, test.args || {}, {
        ...test.additionalArgs,
        consoleLogger: inMemoryLogger
      })

      //Then the results should be returned
      if (test.expected.console) {
        expect(inMemoryLogger.logs).toEqual(test.expected.console)
      }
      if (test.expected.exit) {
        expect(fakeExit).toHaveBeenCalledWith(test.expected.exit.code, test.expected.exit.message)
      } else {
        expect(fakeExit).not.toHaveBeenCalled()
        if (test.expected.operands) {
          expect(result.operands).toEqual(test.expected.operands)
        } else {
          expect(result.operands).toEqual([])
        }
        if (test.expected.args) {
          expect(result.args).toEqual(test.expected.args)
        } else {
          expect(result.args).toEqual({})
        }
        if (test.expected.command) {
          expect(result.subcommand).toEqual(test.expected.command)
        } else {
          expect(result.subcommand).toBeUndefined()
        }
        if (test.expected.anyValues != undefined) {
          expect(result.anyValues).toBe(test.expected.anyValues)
        }
      }
    })
  }
})

describe('argumentCaseConversion', () => {
  const tests = [
    { input: 'fooBar', kebab: 'foo-bar', snake: 'FOO_BAR' },
    { input: 'baz', kebab: 'baz', snake: 'BAZ' },
    { input: 'longOptionNameTest', kebab: 'long-option-name-test', snake: 'LONG_OPTION_NAME_TEST' },
    { input: 'A', kebab: 'a', snake: 'A' },
    { input: 'someXmlValue', kebab: 'some-xml-value', snake: 'SOME_XML_VALUE' },
    { input: 's3AbacOverride', kebab: 's3-abac-override', snake: 'S3_ABAC_OVERRIDE' }
  ]

  for (const test of tests) {
    it(`should convert ${test.input} to kebab case as ${test.kebab}`, () => {
      expect(camelToKebabCase(test.input)).toBe(test.kebab)
    })

    it(`should convert ${test.input} to snake case as ${test.snake}`, () => {
      expect(camelToCapitalSnakeCase(test.input)).toBe(test.snake)
    })
  }
})

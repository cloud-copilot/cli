import { describe, expect, it, vi } from 'vitest'
import { AdditionalCliArguments, CliArgument, Subcommand, parseCliArguments } from './cli.js'
import { exit } from './utils.js'
vi.mock('./utils.js')

interface ParseCliArgumentsTest {
  name: string
  only?: true
  subcommands?: Record<string, Subcommand>
  options?: Record<string, CliArgument>
  additionalArgs?: AdditionalCliArguments

  expected: {
    operands?: string[]
    args?: Record<string, string | string[] | number | number[] | boolean>
    command?: string
    exit?: { code: number; message?: string }
    anyValues?: boolean
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
        options: {}
      },
      download: {
        description: 'Download a file',
        options: {}
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
        options: {}
      },
      download: {
        description: 'Download a file',
        options: {}
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
        options: {}
      },
      inspect: {
        description: 'Download a file',
        options: {}
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
        options: {}
      },
      download: {
        description: 'Download a file',
        options: {}
      }
    },
    additionalArgs: { args: ['foo', 'arg1', 'arg2'] },
    expected: {
      exit: { code: 2, message: 'Unknown command: foo' }
    }
  },
  {
    name: 'convert camelcase to kebabcase',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'multiple' }
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
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
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
    name: 'fail if too many arguments to a single value option',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' },
      bazBang: { type: 'string', description: 'A baz', values: 'single' }
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1', 'arg2', '--baz-bang', 'arg3']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects a single value, but received multiple: arg1, arg2'
      }
    }
  },
  {
    name: 'fail if no arguments to a single value option',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' },
      bazBang: { type: 'string', description: 'A baz', values: 'single' }
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects a value, but received none'
      }
    }
  },
  {
    name: 'fail if a boolean option has a value',
    options: {
      doStuff: { character: 'd', description: 'A foo bar option', type: 'boolean' },
      bazBang: { type: 'string', description: 'A baz', values: 'single' }
    },
    additionalArgs: { args: ['--do-stuff', 'arg1', 'arg2', '--baz-bang', 'arg3'] },
    expected: {
      exit: {
        code: 2,
        message: 'Boolean option --do-stuff does not accept values'
      }
    }
  },
  {
    name: 'if boolean is last put following arguments as operands',
    options: {
      doStuff: { character: 'd', description: 'A foo bar option', type: 'boolean' },
      bazBang: { type: 'string', description: 'A baz', values: 'single' }
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
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'multiple' }
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects at least one value, but received none'
      }
    }
  },
  {
    name: 'no command invalid command when followed by an option',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
    },
    additionalArgs: {
      args: ['hello', '--foo-bar', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Invalid: hello, all options must specified using a --argument'
      }
    }
  },
  {
    name: 'has commands but invalid command provided',
    subcommands: {
      init: {
        description: 'Initialize the project',
        options: {}
      },
      download: {
        description: 'Download a file',
        options: {}
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
        options: {}
      }
    },
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
    },
    additionalArgs: {
      args: ['init', 'arg1', '--foo-bar', 'arg2']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Options must be specified using a --argument, arg1 is ambiguous'
      }
    }
  },
  {
    name: 'argument partial matching',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' },
      barFoo: { type: 'string', description: 'A bar foo option', values: 'single' }
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
    name: 'ambiguous argument',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' },
      fooBaz: { type: 'string', description: 'A bar foo option', values: 'single' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'single' }
    },
    additionalArgs: {
      args: ['--foo-bar', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects a valid number, but received: arg1'
      }
    }
  },
  {
    name: 'multiple number values are parsed',
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'multiple' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'multiple' }
    },
    additionalArgs: {
      args: ['--foo-bar', '123', 'arg1']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects a valid number, but received: arg1'
      }
    }
  },
  {
    name: 'all values after -- are operands',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: { character: 'f', description: 'A foo bar option', type: 'boolean' },
      bazBang: { character: 'b', description: 'baz bang', type: 'boolean' },
      beepBoop: { character: 'c', description: 'beep boop', type: 'boolean' }
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
    options: {
      fooBar: { character: 'f', description: 'A foo bar option', type: 'boolean' },
      bazBang: { character: 'b', description: 'baz bang', type: 'boolean' },
      beepBoop: { character: 'c', description: 'beep boop', type: 'boolean' }
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
    options: {
      fooBar: { character: 'f', description: 'A foo bar option', type: 'boolean' },
      barBaz: { type: 'string', description: 'A bar baz option', values: 'single' }
    },
    additionalArgs: {
      args: ['-f', 'arg1', '--barBaz']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Boolean option(s) -f should not have values'
      }
    }
  },
  {
    name: 'unrecognized single dash boolean',
    options: {
      fooBar: { character: 'f', description: 'A foo bar option', type: 'boolean' }
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
    options: {
      fooBar: { character: 'f', description: 'A foo bar option', type: 'boolean' },
      barBaz: { type: 'string', description: 'A bar baz option', values: 'single' }
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
        code: 0,
        message: '1.0.0'
      }
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
        message: 'Unknown option: --version'
      }
    }
  },
  {
    name: 'boolean environment variable always true',
    options: {
      fooBar: { character: 's', description: 'A foo bar option', type: 'boolean' }
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
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'single' }
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
        message: 'Environment DAVE_FOO_BAR expects a valid number, but received: hello'
      }
    }
  },
  {
    name: 'multiple value string environment variable',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'multiple' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'multiple' }
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
    options: {
      fooBar: { type: 'number', description: 'A foo bar option', values: 'multiple' }
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
        message: 'Environment DAVE_FOO_BAR expects a valid number, but received: hello'
      }
    }
  },
  {
    name: 'should ignore environment variables with the wrong prefix',
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
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
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      }
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects a value, but received none'
      }
    }
  },
  {
    name: 'single enum value is parsed',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      }
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
    name: 'single enum value invalid value',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      }
    },
    additionalArgs: {
      args: ['--foo-bar', 'delta']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar allows only the following values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'single enum option with multiple values',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      },
      bangBaz: {
        type: 'string',
        description: 'bang baz',
        values: 'single'
      }
    },
    additionalArgs: {
      args: ['--foo-bar', 'BETA', 'charlie', '--bang-baz', 'hello']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects a single value, but received multiple: BETA, charlie'
      }
    }
  },
  {
    name: 'single enum environment variable with multiple values at end',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      },
      bangBaz: {
        type: 'string',
        description: 'bang baz',
        values: 'single'
      }
    },
    additionalArgs: {
      envPrefix: 'DAVE',
      env: {
        DAVE_FOO_BAR: 'BETA CHARLIE'
      },
      args: ['--bang-baz', 'hello', 'world']
    },
    expected: {
      args: {
        bangBaz: 'hello'
      },
      operands: ['world']
    }
  },
  {
    name: 'multiple enum values no values provided',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'multiple',
        validValues: ['alpha', 'beta', 'charlie']
      }
    },
    additionalArgs: {
      args: ['--foo-bar']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar expects at least one value, but received none'
      }
    }
  },
  {
    name: 'multiple enum values are parsed',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'multiple',
        validValues: ['alpha', 'beta', 'charlie']
      }
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
    name: 'multiple enum values some invalid',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'multiple',
        validValues: ['alpha', 'beta', 'charlie']
      }
    },
    additionalArgs: {
      args: ['--foo-bar', 'BETA', 'charlie', 'Echo']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Option --foo-bar allows only the following values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'enum environment variable, single value, valid',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      }
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
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'single',
        validValues: ['alpha', 'beta', 'charlie']
      }
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
        message: 'Environment DAVE_FOO_BAR allows only the following values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'enum environment variable, multiple value, valid',
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'multiple',
        validValues: ['alpha', 'beta', 'charlie']
      }
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
    options: {
      fooBar: {
        type: 'enum',
        description: 'A foo bar option',
        values: 'multiple',
        validValues: ['alpha', 'beta', 'charlie']
      }
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
        message: 'Environment DAVE_FOO_BAR allows only the following values: alpha, beta, charlie'
      }
    }
  },
  {
    name: 'fail if a sub command is required but not provided',
    subcommands: {
      init: {
        description: 'Initialize the project',
        options: {}
      },
      download: {
        description: 'Download a file',
        options: {}
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
        options: {
          fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
        }
      }
    },
    options: {
      bazBang: { type: 'string', description: 'baz bang', values: 'single' }
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
        options: {
          fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
        }
      },
      download: {
        description: 'Initialize the project',
        options: {}
      }
    },
    options: {
      bazBang: { type: 'string', description: 'baz bang', values: 'single' }
    },
    additionalArgs: {
      args: ['download', '--foo-bar', 'arg1', '--baz-bang', 'arg2']
    },
    expected: {
      exit: {
        code: 2,
        message: 'Unknown option: --foo-bar'
      }
    }
  },
  {
    name: 'should get subcommand specific environment variables',
    subcommands: {
      init: {
        description: 'Initialize the project',
        options: {
          fooBar: { type: 'string', description: 'A foo bar option', values: 'single' }
        }
      }
    },
    options: {
      bazBang: { type: 'string', description: 'baz bang', values: 'single' }
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
  }
]

describe('parseCliArguments', () => {
  for (const test of parseCliArgumentsTests) {
    const func = test.only ? it.only : it
    func(test.name, () => {
      //Given a list of arguments
      //When the arguments are parsed

      const fakeExit = vi.mocked(exit)
      fakeExit.mockReset()

      const commands = test.subcommands || {} //.map((c) => ({ name: c, description: c }))
      const result = parseCliArguments('myutil', commands, test.options || {}, test.additionalArgs)

      //Then the results should be returned
      if (test.expected.exit) {
        expect(fakeExit).toHaveBeenCalledWith(test.expected.exit.code, test.expected.exit.message)
      } else {
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

  it('should throw an error if an unknown option type is provided', () => {
    expect(() =>
      parseCliArguments(
        'myutil',
        {},
        {
          fooBar: { type: 'string', description: 'A foo bar option', values: 'a bunch' } as any
        },
        { version: '1.0.0', args: ['--foo-bar', 'arg1'] }
      )
    ).toThrow('Unrecognized option values a bunch')
  })
})

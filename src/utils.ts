/**
 * Optionally print a message and exit the process with the given exit code.
 *
 * @param exitCode the exit code to use
 * @param message the message to print
 */
export function exit(exitCode: number, message: string | undefined) {
  if (message) {
    if (exitCode === 0) {
      console.log(message)
    } else {
      console.error(message)
    }
  }
  process.exit(exitCode)
}

/**
 * A utility type to ensure that T has exactly the keys of U, no more and no less.
 */
export type NoExtraKeys<T, Shape> = {
  [K in keyof T]: K extends keyof Shape ? T[K] : never
}

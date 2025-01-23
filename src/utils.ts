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

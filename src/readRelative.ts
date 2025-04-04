import { readFile } from 'fs/promises'
import { join, sep } from 'path'

/**
 * A relatively sane way to read a file from a relative path inside your packaged cli app. For instance to
 * read the package.json inside your package. Works on ESM and CommonJS modules. Use __filename
 * or import.meta.url to get the path of the file you are in and pass it to this function. Set the `levelsUp`
 * based on how your project is packaged. For instance, if your file is packaged in `dist/cli.js` and you would use `1` if
 * you packaged your file is in `dist/src/cli.js` and you would use `2`. Whatever you need to get to the root.
 * Then the path parts are the path to the file you want to read, relative to the root of your project with each
 * directory as a separate string in the array and the file name as the last string in the array. They will be
 * joined together in a way that makes sense for the OS and module type your package is running in.
 *
 * @param currentFile the path to start from use `import.meta.url` or `__filename` for most cases
 * @param levelsUp since __import.meta.url or __filename is the file you are in, you need to go up a few levels to ge to the root of your project. Use 0 for the current directory of the file you're calling from.
 * @param pathParts the path to the file, relative to the new root
 * @returns the contents of the file as a string
 */
export async function readRelativeFile(
  currentFile: string,
  levelsUp: number,
  pathParts: string[]
): Promise<string> {
  const isEsm = currentFile.startsWith('file://')
  const backSegments = Array(levelsUp).fill('..')

  if (isEsm) {
    const dirPath = currentFile.slice(0, currentFile.lastIndexOf('/'))
    const { fileURLToPath } = await import('node:url')
    const { join } = await import('node:path')
    const startPath = fileURLToPath(dirPath)
    const fullPath = join(startPath, ...backSegments, ...pathParts)
    return await readFile(fullPath, 'utf8')
  } else {
    const dirPath = currentFile.slice(0, currentFile.lastIndexOf(sep))
    const contents = await readFile(join(dirPath, ...backSegments, ...pathParts), 'utf8')
    return contents
  }
}

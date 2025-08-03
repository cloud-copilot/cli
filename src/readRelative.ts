import { readFile } from 'fs/promises'
import { join, sep } from 'path'

/**
 * An interface for reading files from a relative path inside your packaged cli app. For instance to
 * read the package.json inside your package. Works on ESM and CommonJS modules.
 */
export interface PackageFileReader {
  /**
   * Read a file from a relative path inside your packaged cli app. For instance to
   * read the package.json inside your package. Works on ESM and CommonJS modules.
   *
   * @param pathParts the path to the file, relative to the root of your project with each
   * directory as a separate string in the array and the file name as the last string in the array.
   */
  readFile(pathParts: string[]): Promise<string>
}

class CommonJsPackageFileReader implements PackageFileReader {
  private rootPath: string
  constructor(currentFile: string, levelsUp: number) {
    const dirPath = currentFile.slice(0, currentFile.lastIndexOf(sep))
    this.rootPath = join(dirPath, ...backSegments(levelsUp))
  }

  async readFile(pathParts: string[]): Promise<string> {
    const fullPath = join(this.rootPath, ...pathParts)
    return readFile(fullPath, 'utf8')
  }
}

class EsmPackageFileReader implements PackageFileReader {
  private rootPath: string | undefined

  constructor(
    private currentFile: string,
    private levelsUp: number
  ) {}

  /**
   * Lookup the root path of the project, going up the specified number of levels from the current file.
   *
   * @returns the root path of the project, calculated once and cached
   */
  private async getRootPath(): Promise<string> {
    if (!this.rootPath) {
      const dirPath = this.currentFile.slice(0, this.currentFile.lastIndexOf('/'))
      const { fileURLToPath } = await import('node:url')
      const startPath = fileURLToPath(dirPath)
      this.rootPath = join(startPath, ...backSegments(this.levelsUp))
    }

    return this.rootPath
  }

  async readFile(pathParts: string[]): Promise<string> {
    const { join } = await import('node:path')
    const root = await this.getRootPath()
    const fullPath = join(root, ...pathParts)
    return readFile(fullPath, 'utf8')
  }
}

/**
 * A relatively sane way to read a file from a relative path inside your packaged cli app. For instance to
 * read the package.json inside your package. Works on ESM and CommonJS modules. Use __filename
 * or import.meta.url to get the path of the file you are in and pass it to this function. Set the `levelsUp`
 * based on how your project is packaged. For instance, if your file is packaged in `dist/cli.js` and you would use `1` if
 * you packaged your file is in `dist/src/cli.js` and you would use `2`. Whatever you need to get to the root.
 *
 * You get back a `PackageFileReader` which has a `readFile` method. You can then call that method
 * with the path parts to the file you want to read, relative to the root of your project.
 * For instance, to read the `package.json` file in the root of your project, you would call:
 * ```ts
 *   const reader = await createPackageFileReader(import.meta.url, 1) // if your file is in dist/cli.js
 *   const packageJson = await reader.readFile(['package.json'])
 * ```
 *
 * @param currentFile the path to start from use `import.meta.url` for esm or `__filename` for CommonJS in most cases
 * @param levelsUp since __import.meta.url or __filename is the file you are in, you need to go up a few levels to ge to the root of your project. Use 0 for the current directory of the file you're calling from.
 * @returns a `PackageFileReader` you can use to read files relative to the root of your project.
 */
export function createPackageFileReader(currentFile: string, levelsUp: number): PackageFileReader {
  const isEsm = currentFile.startsWith('file://')
  if (isEsm) {
    return new EsmPackageFileReader(currentFile, levelsUp)
  }
  return new CommonJsPackageFileReader(currentFile, levelsUp)
}

/**
 * Create an array of `..` segments to go up the specified number of levels in a path.
 *
 * @param levelsUp the number of levels to go up
 * @returns an array of `..` segments
 */
function backSegments(levelsUp: number): string[] {
  return Array(levelsUp).fill('..')
}

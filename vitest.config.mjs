import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test-d.ts'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.typetest.json',
      include: ['src/**/*.test-d.ts']
    }
  }
})

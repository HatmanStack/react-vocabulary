module.exports = {
  extends: ['expo'],
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'web-build/', 'backend/'],
  overrides: [
    {
      files: ['jest.setup.js', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      env: {
        jest: true,
      },
    },
  ],
};

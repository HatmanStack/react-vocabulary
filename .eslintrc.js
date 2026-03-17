module.exports = {
  extends: ["expo"],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".expo/",
    "web-build/",
    "backend/",
  ],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  overrides: [
    {
      files: [
        "jest.setup.js",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**",
      ],
      env: {
        jest: true,
      },
    },
    {
      files: ["scripts/**"],
      rules: {
        "no-console": "off",
      },
    },
  ],
};

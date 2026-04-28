import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./app"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./tests/setup.js"],
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.js"],
          environment: "node",
          testTimeout: 5000,
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.js"],
          environment: "node",
          testTimeout: 15000,
        },
      },
      {
        test: {
          name: "factories",
          include: ["tests/factories/**/*.test.js"],
          environment: "node",
          testTimeout: 30000,
        },
      },
      {
        test: {
          name: "feature",
          include: ["tests/feature/**/*.test.js"],
          environment: "node",
          testTimeout: 30000,
        },
      },
      {
        test: {
          name: "arch",
          include: ["tests/architecture/**/*.test.js"],
          environment: "node",
          testTimeout: 10000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["app/**/*.js"],
      exclude: [
        "node_modules/**",
        "docker/**",
        "storage/**",
        "tests/**",
        "main.js",
        "knexfile.js",
      ],
      reporter: ["text", "html", "json"],
      reportsDirectory: "./storage/coverage",
    },
  },
});
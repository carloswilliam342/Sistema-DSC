import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Ambiente Node (sem DOM) — é uma aplicação backend Express
    environment: "node",
    // Permite usar describe/it/expect sem importar em cada arquivo
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Arquivos de código-fonte que contam para a cobertura
      include: [
        "controllers/**/*.js",
        "models/**/*.js",
        "routes/**/*.js",
        "utils/**/*.js",
        "config/**/*.js",
        "client.js",
        "app.js",
      ],
      exclude: [
        "node_modules/**",
        "tests/**",
        // Config do Sequelize-CLI (usada só por migrations/CLI, não pelo app)
        "config/config.js",
      ],
      // Meta atingida — o build falha se a cobertura cair abaixo destes valores.
      // Aumente as metas conforme a suíte cresce (ideal: tudo em 80%+).
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});

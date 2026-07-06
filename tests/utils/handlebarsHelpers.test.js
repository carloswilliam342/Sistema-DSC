import { describe, it, expect } from "vitest";
import { handlebarsHelpers } from "../../utils/handlebarsHelpers.js";

const { eq, json, truncate, formatDate, ifCond } = handlebarsHelpers;

describe("helper eq", () => {
  it("retorna true para valores estritamente iguais", () => {
    expect(eq("a", "a")).toBe(true);
    expect(eq(1, 1)).toBe(true);
  });

  it("retorna false para valores diferentes ou de tipos diferentes", () => {
    expect(eq(1, "1")).toBe(false);
    expect(eq("a", "b")).toBe(false);
  });
});

describe("helper json", () => {
  it("serializa o objeto para JSON", () => {
    expect(json({ a: 1 })).toBe('{"a":1}');
  });
});

describe("helper truncate", () => {
  it("retorna string vazia para valores falsy", () => {
    expect(truncate(null, 10)).toBe("");
    expect(truncate("", 10)).toBe("");
  });

  it("não trunca quando o texto é menor que o limite", () => {
    expect(truncate("curto", 10)).toBe("curto");
  });

  it("trunca e adiciona reticências quando excede o limite", () => {
    expect(truncate("texto muito longo", 5)).toBe("texto...");
  });
});

describe("helper formatDate", () => {
  it("retorna string vazia para data ausente", () => {
    expect(formatDate(null)).toBe("");
  });

  it("formata data no padrão pt-BR", () => {
    const resultado = formatDate("2025-01-15");
    expect(resultado).toContain("2025");
    expect(resultado).toContain("janeiro");
  });
});

describe("helper ifCond", () => {
  // Simula o objeto `options` que o Handlebars passa para block helpers
  const options = {
    fn: () => "VERDADEIRO",
    inverse: () => "FALSO",
  };

  it("avalia igualdade estrita (===)", () => {
    expect(ifCond(1, "===", 1, options)).toBe("VERDADEIRO");
    expect(ifCond(1, "===", 2, options)).toBe("FALSO");
  });

  it("avalia maior que (>)", () => {
    expect(ifCond(5, ">", 3, options)).toBe("VERDADEIRO");
    expect(ifCond(2, ">", 3, options)).toBe("FALSO");
  });

  it("avalia operador lógico ||", () => {
    expect(ifCond(false, "||", true, options)).toBe("VERDADEIRO");
    expect(ifCond(false, "||", false, options)).toBe("FALSO");
  });

  it("retorna o ramo inverso para operador desconhecido", () => {
    expect(ifCond(1, "??", 2, options)).toBe("FALSO");
  });
});

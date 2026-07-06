import { describe, it, expect } from "vitest";
import { validarSenha } from "../../utils/validarSenha.js";

describe("validarSenha", () => {
  it("aceita uma senha forte válida", () => {
    expect(validarSenha("Senha@123")).toBe(true);
  });

  it("aceita senha com espaços nas bordas (faz trim)", () => {
    expect(validarSenha("  Senha@123  ")).toBe(true);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    expect(validarSenha("Ab@1")).toBe(false);
  });

  it("rejeita senha sem letra maiúscula", () => {
    expect(validarSenha("senha@123")).toBe(false);
  });

  it("rejeita senha sem letra minúscula", () => {
    expect(validarSenha("SENHA@123")).toBe(false);
  });

  it("rejeita senha sem número", () => {
    expect(validarSenha("Senha@abc")).toBe(false);
  });

  it("rejeita senha sem símbolo", () => {
    expect(validarSenha("Senha1234")).toBe(false);
  });

  it("rejeita valores que não são string", () => {
    expect(validarSenha(undefined)).toBe(false);
    expect(validarSenha(null)).toBe(false);
    expect(validarSenha(12345678)).toBe(false);
  });
});

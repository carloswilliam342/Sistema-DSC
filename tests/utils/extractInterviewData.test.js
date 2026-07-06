import { describe, it, expect } from "vitest";
import { extractInterviewData } from "../../utils/extractInterviewData.js";

describe("extractInterviewData", () => {
  it("retorna lista vazia para entrada vazia ou nula", () => {
    expect(extractInterviewData("")).toEqual([]);
    expect(extractInterviewData(null)).toEqual([]);
    expect(extractInterviewData(undefined)).toEqual([]);
  });

  it("extrai um entrevistado com todos os campos", () => {
    const texto = [
      "Nome: Ana",
      "Idade: 30",
      "Cidade: Recife",
      "Estado civil: Solteira",
      "Renda: 3000",
      "Gênero: Feminino",
      "Resposta: Acho o serviço excelente",
    ].join("\n");

    const resultado = extractInterviewData(texto);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      nome: "Ana",
      idade: "30",
      cidade: "Recife",
      estadoCivil: "Solteira",
      renda: "3000",
      genero: "Feminino",
      resposta: "Acho o serviço excelente",
    });
  });

  it("separa múltiplos entrevistados por linha em branco", () => {
    const texto = [
      "Nome: Ana",
      "Resposta: Positiva",
      "",
      "Nome: João",
      "Resposta: Negativa",
    ].join("\n");

    const resultado = extractInterviewData(texto);

    expect(resultado).toHaveLength(2);
    expect(resultado[0].nome).toBe("Ana");
    expect(resultado[1].nome).toBe("João");
  });

  it("tolera bullets e negrito markdown nos rótulos", () => {
    const texto = [
      "* **Nome**: Maria",
      "- Cidade: São Luís",
      "Resposta: Muito bom",
    ].join("\n");

    const resultado = extractInterviewData(texto);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].nome).toBe("Maria");
    expect(resultado[0].cidade).toBe("São Luís");
  });

  it("aceita texto livre longo como resposta quando já há nome", () => {
    const texto = [
      "Nome: Carlos",
      "Esta é uma opinião bem longa que ultrapassa quarenta caracteres com folga.",
    ].join("\n");

    const resultado = extractInterviewData(texto);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].resposta).toContain("opinião bem longa");
  });
});

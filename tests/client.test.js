import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do SDK do Gemini. `vi.hoisted` garante que mockGenerate exista
// antes do vi.mock ser içado para o topo do módulo.
const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {
      this.models = { generateContent: mockGenerate };
    }
  },
}));

// Importado depois do mock (o client instancia o SDK no carregamento)
import ClientGemini from "../client.js";

function erroComStatus(status) {
  return Object.assign(new Error(`status ${status}`), { status });
}

describe("ClientGemini (retry)", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna o texto quando a chamada é bem-sucedida", async () => {
    mockGenerate.mockResolvedValue({ text: "discurso gerado" });

    const resultado = await ClientGemini("prompt");

    expect(resultado).toBe("discurso gerado");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("tenta novamente após erro 503 e retorna na segunda tentativa", async () => {
    mockGenerate
      .mockRejectedValueOnce(erroComStatus(503))
      .mockResolvedValueOnce({ text: "ok na segunda" });

    const promise = ClientGemini("prompt");
    await vi.runAllTimersAsync(); // avança o backoff sem esperar de verdade
    const resultado = await promise;

    expect(resultado).toBe("ok na segunda");
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("propaga o erro imediatamente quando não é transitório (ex: 400)", async () => {
    mockGenerate.mockRejectedValue(erroComStatus(400));

    await expect(ClientGemini("prompt")).rejects.toMatchObject({ status: 400 });
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("desiste após 3 tentativas em erro 503 persistente", async () => {
    mockGenerate.mockRejectedValue(erroComStatus(503));

    const promise = ClientGemini("prompt");
    // Anexa o handler de rejeição antes de avançar os timers para
    // evitar "unhandled rejection".
    const expectativa = expect(promise).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await expectativa;

    expect(mockGenerate).toHaveBeenCalledTimes(3);
  });
});

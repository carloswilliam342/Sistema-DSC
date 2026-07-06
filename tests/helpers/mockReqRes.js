import { vi } from "vitest";
import { PassThrough } from "stream";

// Cria um objeto `req` simulado do Express.
export function criarReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    session: {},
    flash: vi.fn(),
    ...overrides,
  };
}

// Cria um objeto `res` simulado com os métodos mais usados.
// status/render/send/json/redirect/setHeader são espiões encadeáveis.
export function criarRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.render = vi.fn(() => res);
  res.send = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.redirect = vi.fn(() => res);
  res.setHeader = vi.fn(() => res);
  res.end = vi.fn(() => res);
  return res;
}

// Cria um `res` que também é um stream gravável (para exportações de
// PDF/Excel que fazem `pipe`/`write` na resposta).
export function criarResStream() {
  const stream = new PassThrough();
  stream.resume(); // descarta os bytes para não travar o teste
  stream.status = vi.fn(() => stream);
  stream.send = vi.fn(() => stream);
  stream.setHeader = vi.fn(() => stream);
  return stream;
}

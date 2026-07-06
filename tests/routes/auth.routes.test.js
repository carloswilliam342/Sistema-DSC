import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Rotas de autenticação (integração)", () => {
  it("GET /login responde 200 com HTML", async () => {
    const res = await request(app).get("/login");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("GET /registro responde 200 com HTML", async () => {
    const res = await request(app).get("/registro");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("rota inexistente responde 404", async () => {
    const res = await request(app).get("/rota-que-nao-existe");
    expect(res.status).toBe(404);
  });
});

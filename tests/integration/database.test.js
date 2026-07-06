import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";

// SEM mocks: estes testes usam os models reais contra um banco SQLite
// em memória. O `config/database.js` já troca para SQLite quando
// NODE_ENV === "test" (o Vitest define isso automaticamente).
import sequelize from "../../config/database.js";
import User from "../../models/User.js";
import Discurso from "../../models/Discurso.js";
import DiscursoCriado from "../../models/DiscursoCriado.js";
import Favorito from "../../models/Favorito.js";
import Analise from "../../models/Analise.js";
import { logarUsuario } from "../../controllers/AuthController.js";
import bcrypt from "bcrypt";

// Recria todas as tabelas antes de cada teste → isolamento total
beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("User (persistência real)", () => {
  it("cria e recupera um usuário do banco", async () => {
    await User.create({
      nome: "Ana",
      email: "ana@teste.com",
      senha: "hash123",
      tipoUsuario: "ESTUDANTE",
    });

    const encontrado = await User.findOne({ where: { email: "ana@teste.com" } });
    expect(encontrado).not.toBeNull();
    expect(encontrado.nome).toBe("Ana");
  });

  it("aplica os valores padrão (primeiroLogin=true, tipoUsuario=ESTUDANTE)", async () => {
    const usuario = await User.create({
      nome: "Bia",
      email: "bia@teste.com",
      senha: "hash123",
    });
    expect(usuario.primeiroLogin).toBe(true);
    expect(usuario.tipoUsuario).toBe("ESTUDANTE");
  });

  it("respeita a restrição de e-mail único", async () => {
    await User.create({ nome: "Ana", email: "dup@teste.com", senha: "h" });
    // Segundo cadastro com o mesmo e-mail deve falhar no banco
    await expect(
      User.create({ nome: "Outra", email: "dup@teste.com", senha: "h" })
    ).rejects.toThrow();
  });

  it("exige campos obrigatórios (allowNull: false)", async () => {
    // Sem 'nome' → o banco/validação deve rejeitar
    await expect(
      User.create({ email: "semnome@teste.com", senha: "h" })
    ).rejects.toThrow();
  });
});

describe("Discurso + Favorito (consulta real com associação)", () => {
  it("cria discursos e filtra por categoria", async () => {
    await Discurso.create({ titulo: "A", categoria: "Educação", descricao: "d1" });
    await Discurso.create({ titulo: "B", categoria: "Saúde", descricao: "d2" });
    await Discurso.create({ titulo: "C", categoria: "Educação", descricao: "d3" });

    const educacao = await Discurso.findAll({ where: { categoria: "Educação" } });
    expect(educacao).toHaveLength(2);
  });

  it("carrega o discurso associado ao favorito (include)", async () => {
    const discurso = await Discurso.create({ titulo: "T", categoria: "DSC", descricao: "d" });
    await Favorito.create({ usuarioId: 1, discursoId: discurso.id });

    const favoritos = await Favorito.findAll({
      include: [{ model: Discurso, as: "Discurso" }],
    });
    expect(favoritos).toHaveLength(1);
    expect(favoritos[0].Discurso.titulo).toBe("T");
  });
});

describe("Discurso x DiscursoCriado (regressão: colisão de nome)", () => {
  it("são models distintos, com tabelas próprias", () => {
    // Antes da correção ambos se chamavam "Discurso" e um sobrescrevia o outro.
    expect(sequelize.models.Discurso).toBeDefined();
    expect(sequelize.models.DiscursoCriado).toBeDefined();
    expect(Discurso).not.toBe(DiscursoCriado);
    expect(Discurso.tableName).not.toBe(DiscursoCriado.tableName);
  });

  it("persistir um não interfere no outro", async () => {
    await Discurso.create({ titulo: "T", categoria: "DSC", descricao: "d" });
    await DiscursoCriado.create({ textoOriginal: "antes", textoTransformado: "depois" });

    expect(await Discurso.count()).toBe(1);
    expect(await DiscursoCriado.count()).toBe(1);
  });
});

describe("Analise (validação de e-mail no model)", () => {
  it("rejeita e-mail inválido pela validação isEmail", async () => {
    await expect(
      Analise.create({
        titulo: "X",
        data_inicio: new Date(),
        data_fim: new Date(),
        plataforma: "P",
        email: "isso-nao-e-email",
        descricao: "d",
      })
    ).rejects.toThrow();
  });
});

describe("logarUsuario (fluxo completo: controller + bcrypt + banco real)", () => {
  it("faz login com senha correta e redireciona para /dashboard", async () => {
    const hash = await bcrypt.hash("Senha@123", 10);
    await User.create({
      nome: "Ana",
      email: "login@teste.com",
      senha: hash,
      tipoUsuario: "ESTUDANTE",
      primeiroLogin: false,
    });

    const req = { body: { email: "login@teste.com", senha: "Senha@123" }, session: {}, flash: vi.fn() };
    const res = { redirect: vi.fn(), render: vi.fn() };

    await logarUsuario(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
    expect(req.session.usuario).toBeDefined();
  });

  it("rejeita login com senha errada (renderiza login)", async () => {
    const hash = await bcrypt.hash("Senha@123", 10);
    await User.create({ nome: "Ana", email: "login2@teste.com", senha: hash });

    const req = { body: { email: "login2@teste.com", senha: "ERRADA" }, session: {}, flash: vi.fn() };
    const res = { redirect: vi.fn(), render: vi.fn() };

    await logarUsuario(req, res);

    expect(res.render).toHaveBeenCalledWith("login");
    expect(res.redirect).not.toHaveBeenCalled();
  });
});

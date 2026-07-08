import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/database.js";
import { BASE_PATH } from "./config/basePath.js";

const PORT = process.env.PORT || 3000;

// Testa a conexão. O schema é gerenciado pelas migrations (serviço `migrate`),
// não mais por sequelize.sync().
sequelize
  .authenticate()
  .then(() => {
    console.log("Conexão com o MySQL foi bem-sucedida!");
  })
  .catch((err) => {
    console.error("Erro ao conectar ao banco de dados:", err);
  });

// Inicia o servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}${BASE_PATH}`);
});

// Graceful shutdown: para de aceitar novas conexões, deixa as requisições em
// andamento terminarem e só então fecha a pool do MySQL. Sem isso o container
// mata o processo na marra em cada deploy/restart (SIGTERM), derrubando
// requisições em andamento.
function shutdown(signal) {
  console.log(`${signal} recebido, encerrando servidor...`);

  const forceExit = setTimeout(() => {
    console.error("Timeout ao encerrar conexões, forçando saída.");
    process.exit(1);
  }, 10000);

  server.close(async (err) => {
    clearTimeout(forceExit);
    if (err) {
      console.error("Erro ao fechar o servidor:", err);
      process.exit(1);
    }
    try {
      await sequelize.close();
      console.log("Servidor encerrado.");
      process.exit(0);
    } catch (closeErr) {
      console.error("Erro ao fechar conexão com o banco:", closeErr);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

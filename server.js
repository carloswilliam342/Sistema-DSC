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
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}${BASE_PATH}`);
});

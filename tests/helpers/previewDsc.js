// Prévia manual isolada: SQLite em memória, usuário fictício, acesso só por loopback.
// Ex.: $env:NODE_ENV='test'; node tests/helpers/previewDsc.js
// Gerações usam o Gemini configurado localmente: use somente depoimentos fictícios.
if (process.env.NODE_ENV !== "test") throw new Error("Execute esta prévia apenas com NODE_ENV=test.");
const { default: express } = await import("express");
const { engine } = await import("express-handlebars");
const { default: sequelize } = await import("../../config/database.js");
const { default: router } = await import("../../routes/discursoRoutes.js");
await sequelize.sync();
const preview = express();
preview.engine("handlebars", engine({ defaultLayout: "main" }));
preview.set("view engine", "handlebars");
preview.use(express.json({ limit: "1mb" }));
preview.use((req, res, next) => { req.session = { usuario: { id: 1, nome: "Pesquisador de teste" } }; res.locals.basePath = "/dsc"; next(); });
preview.use("/dsc", express.static("public"));
preview.use("/dsc/criar-discurso", router);
const server = preview.listen(3107, "127.0.0.1", () => console.log("Prévia isolada em http://127.0.0.1:3107/dsc/criar-discurso"));
process.on("SIGINT", () => server.close(async () => { await sequelize.close(); process.exit(0); }));

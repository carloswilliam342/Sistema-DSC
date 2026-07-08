import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import { fileURLToPath } from "url";
import session from "express-session";
import expressMySQLSession from "express-mysql-session";
import flash from "connect-flash";
import Handlebars from "handlebars";
import cors from "cors";

import { BASE_PATH } from "./config/basePath.js";
import dashboardRouter from "./routes/dashboard.js";
import discursosRoutes from "./routes/discursos.js";
import discursoCriadoRoutes from "./routes/discursoRoutes.js";
import authRoutes from "./routes/auth.js";
import beneficiosRoutes from "./routes/beneficios.js";
import comoFuncionaRoutes from "./routes/como-funciona.js";
import recursosRoutes from "./routes/recursosRoutes.js";
import artigoRoutes from "./routes/artigos.js";
import analiseRoutes from "./routes/analiseRoutes.js";
import depoimentosRoutes from "./routes/depoimentos.js";
import sobreRoutes from "./routes/sobre.js";
import indexRouter from "./routes/index.js";
import { handlebarsHelpers } from "./utils/handlebarsHelpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// Todas as rotas ficam num router montado em BASE_PATH (deploy em subdiretório).
const router = express.Router();

// Interpretando dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Processa JSON

app.use(cors());

// Healthcheck. Fica fora do BASE_PATH (não é montado no router) para
// responder sempre em /health, independente do subdiretório de produção.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Disponibiliza o prefixo de subdiretório (ex: /dsc) para as views
app.use((req, res, next) => {
  res.locals.basePath = BASE_PATH;
  next();
});

// Middleware para arquivos estáticos (CSS, JS, imagens)
router.use(express.static(path.join(__dirname, "public")));
router.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Sessão: em produção persiste no MySQL; em teste usa store em memória
// (evita tentar conectar no MySQL ao importar o app durante os testes).
let sessionStore;
if (process.env.NODE_ENV !== "test") {
  const MySQLStore = expressMySQLSession(session);
  sessionStore = new MySQLStore({
    host: process.env.DB_HOST || "localhost",
    port: 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "dsc_ifma",
  });
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "dev_secret_troque_em_producao",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
    },
  })
);

// Mensagens flash
app.use(flash());

// Middleware para disponibilizar mensagens flash globalmente
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// Configurando handlebars
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: handlebarsHelpers,
  })
);

// Middleware para disponibilizar mensagens na view
app.use((req, res, next) => {
  res.locals.sucesso = req.flash("sucesso");
  res.locals.erro = req.flash("error");
  next();
});

// Middleware de debug de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).render("error", { error: err });
});

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Rota inicial
router.get("/", (req, res) => {
  res.render("home", { usuario: req.session.usuario }); // Renderiza a página inicial
});

router.use("/", authRoutes);
router.use("/discursos", discursosRoutes);
router.use("/depoimentos", depoimentosRoutes);
router.use(comoFuncionaRoutes);
router.use(recursosRoutes);
router.use(sobreRoutes);
router.use("/criar-discurso", discursoCriadoRoutes);
router.use(beneficiosRoutes);
router.use(artigoRoutes);
router.use("/", analiseRoutes);
router.use("/", dashboardRouter);
router.use("/", indexRouter);

// Monta o router no prefixo de subdiretório (ou na raiz, se BASE_PATH vazio)
if (BASE_PATH) {
  app.use(BASE_PATH, router);
} else {
  app.use(router);
}

export default app;

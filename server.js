import express from "express";
import { engine } from "express-handlebars";
import sequelize from "./config/database.js";
import { BASE_PATH } from "./config/basePath.js";
import dotenv from "dotenv";
import path from "path";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import { fileURLToPath } from 'url'
import dashboardRouter from "./routes/dashboard.js";
import discursosRoutes from "./routes/discursos.js";
import discursoCriadoRoutes from "./routes/discursoRoutes.js"
import session from "express-session";
import expressMySQLSession from "express-mysql-session";
import authRoutes from "./routes/auth.js";
import beneficiosRoutes from "./routes/beneficios.js";
import comoFuncionaRoutes from "./routes/como-funciona.js";
import recursosRoutes from "./routes/recursosRoutes.js";
import artigoRoutes from "./routes/artigos.js";
import analiseRoutes from "./routes/analiseRoutes.js";
import depoimentosRoutes from "./routes/depoimentos.js";
import sobreRoutes from "./routes/sobre.js";
import flash from "connect-flash";
import indexRouter from './routes/index.js';
import handlebars from "express-handlebars";
import cors from "cors";
import multer from "multer";
import Handlebars from "handlebars";

dotenv.config();


const app = express();
const router = express.Router();

// Interpretando dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Processa JSON

app.use(cors());

// Disponibiliza o prefixo de subdiretório (ex: /dsc em produção) para as views
app.use((req, res, next) => {
  res.locals.basePath = BASE_PATH;
  next();
});

// Middleware para arquivos estáticos (CSS, JS, imagens)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
router.use(express.static(path.join(__dirname, 'public')))
router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MySQLStore = expressMySQLSession(session);
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dsc_ifma",
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));
// Mensagens flash
app.use(flash());


// Middleware para disponibilizar mensagens flash globalmente
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});


// Configurando handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: {
    eq: function (v1, v2) {
      return v1 === v2;
    },
    json: function (context) {
      return JSON.stringify(context);
    },
    withBase: function (value) {
      if (typeof value === "string" && value.startsWith("/")) {
        return BASE_PATH + value;
      }
      return value;
    },
    truncate: function (str, len) {
      if (!str) return "";
      str = String(str);
      return str.length > len ? str.substring(0, len) + "..." : str;
    },
    formatDate: function (date) {
      if (!date) return "";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(date));
    },
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case "==":
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!=":
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        case "!==":
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case "<":
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case "<=":
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case ">":
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case ">=":
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case "&&":
          return v1 && v2 ? options.fn(this) : options.inverse(this);
        case "||":
          return v1 || v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },
  },
}));

// Middleware para disponibilizar mensagens na view
app.use((req, res, next) => {
  res.locals.sucesso = req.flash("sucesso");
  res.locals.erro = req.flash("error");
  next();
});
// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', { error: err });
});


app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

const PORT = 3000; // Porta que será usada para rodar o servidor

// Testa a conexão e sincroniza o banco
sequelize.authenticate()
  .then(() => {
    console.log("Conexão com o MySQL foi bem-sucedida!");
    return sequelize.sync();
  })
  .then(() => {
    console.log("Banco de dados sincronizado!");
  })
  .catch(err => {
    console.error("Erro ao conectar ao banco de dados:", err);
  });

  app.use((req, res, next) => {
    const oldRender = res.render;
    res.render = function(view, locals) {
        console.log('View being rendered:', view);
        console.log('Data being passed:', locals);
        oldRender.apply(this, arguments);
    };
    next();
});

const upload = multer({dest: "uploads/imagens-discursos"})

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

router.use('/', indexRouter);

if (BASE_PATH) {
  app.use(BASE_PATH, router);
} else {
  app.use(router);
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}${BASE_PATH}`);
});



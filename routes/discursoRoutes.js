import express from "express";
import { checkAuth } from "./auth.js";
import multer from "multer";
import { baixarDiscurso, baixarRelatorio } from "../controllers/criarDiscursoController.js";
import { analisarPesquisa, listarPesquisas, obterPesquisa, gerarPesquisa, importarDepoimento, exportarPesquisa } from "../controllers/pesquisaDscController.js";

const router = express.Router();

// Validação dos tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "text/plain", // .txt
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/pdf" // .pdf
    ];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Apenas arquivos .txt, .docx ou .pdf são permitidos."));
    }
    cb(null, true);
};

// Rota para renderizar a página de criar discurso
router.get("/", checkAuth, (req, res) => {
    res.render("pesquisa-dsc");
});

router.get("/historico", checkAuth, (req, res) => res.render("pesquisa-dsc", { historico: true }));
router.get("/api/pesquisas", checkAuth, listarPesquisas);
router.get("/api/pesquisas/:id", checkAuth, obterPesquisa);
router.get("/api/pesquisas/:id/pdf", checkAuth, exportarPesquisa);
router.post("/api/pesquisas", checkAuth, express.json({ limit: "1mb" }), analisarPesquisa);
router.post("/api/pesquisas/:id/gerar", checkAuth, express.json({ limit: "1mb" }), gerarPesquisa);
const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter });
router.post("/api/importar", checkAuth, (req, res, next) => importUpload.single("arquivo")(req, res, error => {
    if (error) return res.status(400).json({ erro: error.code === "LIMIT_FILE_SIZE" ? "O arquivo deve ter até 5 MB." : "Envie apenas um arquivo TXT, DOCX ou PDF." });
    next();
}), importarDepoimento);

// Rota para processar o discurso
// O fluxo antigo não exigia categorias nem revisão e não possuía histórico.
router.post("/transformar", checkAuth, (req, res) => res.status(410).json({ erro: "A geração agora é feita pelo fluxo em etapas de Criar Discurso: categorias, respondentes, depoimentos e revisão." }));

// Rota para download do discurso convertendo para PDF
router.get("/download/:filename", checkAuth, baixarDiscurso);

// Rota para download do relatório
router.get("/download-relatorio/:filename", checkAuth, baixarRelatorio);

export default router;


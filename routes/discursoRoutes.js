import express from "express";
import multer from "multer";
import path from "path";
import { processarDiscurso } from "../controllers/criarDiscursoController.js";
import { checkAuth } from "./auth.js";
import fs from "fs";

const uploadPath = "uploads/discursos-criados";
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const router = express.Router();

// Configuração do multer para salvar arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/discursos-criados");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

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

const upload = multer({ dest: "uploads/discursos-criados", fileFilter });


// Rota para renderizar a página de criar discurso
router.get("/", (req, res) => {
    res.render("criar-discurso");
});

// Rota para processar o discurso
router.post("/transformar",  upload.single("arquivo"), processarDiscurso);

export default router;


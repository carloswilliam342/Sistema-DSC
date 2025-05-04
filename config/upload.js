import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = "uploads/imagens-discursos";
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}
// Configuração do armazenamento das imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/imagens-discursos"); // Pasta onde serão salvas as imagens
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

export default upload;

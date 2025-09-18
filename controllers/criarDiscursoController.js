import axios from "axios";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import mammoth from "mammoth";
import upload  from "../config/upload.js"; // Importa o middleware de upload
import pdfParse from "pdf-parse";
import ClientGemini from "../client.js"; // Importa o cliente Gemini

export const processarDiscurso = async (req, res) => {
    let texto = req.body.texto || "";

    // Se um arquivo foi enviado, processa o conteúdo dele
    if (req.file) {
        console.log("Arquivo recebido:", req.file);

        const filePath = path.resolve("uploads", "discursos-criados", req.file.filename);
        try {
            if (req.file.mimetype === "text/plain") {
                // Processa arquivos .txt
                texto = fs.readFileSync(filePath, "utf-8");
            } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                // Processa arquivos .docx usando mammoth
                const result = await mammoth.extractRawText({ path: filePath });
                texto = result.value; // O texto extraído do arquivo .docx
            } else if (req.file.mimetype === "application/pdf") {
                // Processa arquivos .pdf usando pdf-parse
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                texto = pdfData.text; // O texto extraído do PDF
            } else {
                return res.status(400).json({ erro: "Tipo de arquivo não suportado." });
            }

            fs.unlinkSync(filePath); // Remove o arquivo após a leitura
        } catch (err) {
            console.error("Erro ao processar o arquivo:", err);
            return res.status(500).json({ erro: "Erro ao processar o arquivo." });
        }
    }


    if (!texto.trim()) {
        return res.status(400).json({ erro: "O texto é obrigatório!" });
    }
 // Prompt para a IA 
  const prompt = `
    Você é um assistente especializado na metodologia do Discurso do Sujeito Coletivo (DSC), uma técnica qualitativa utilizada para sintetizar opiniões individuais em um discurso coletivo representativo.

    Dado um conjunto de respostas individuais sobre um determinado tema, sua tarefa é estruturar um Discurso do Sujeito Coletivo (DSC) seguindo estas diretrizes:

    Identificação das Ideias Centrais: Analise as respostas fornecidas e identifique as principais ideias que aparecem repetidamente ou que representam padrões significativos no discurso dos participantes.

    Agrupamento por Expressões-Chave: Identifique trechos das respostas que expressem de forma clara e objetiva cada uma das ideias centrais.

    Construção do Discurso Coletivo: Com base nas expressões-chave, redija um discurso único na primeira pessoa do singular ("eu"), de forma fluida e coerente, como se fosse a fala de um único indivíduo que representa a coletividade dos participantes.

    Manutenção da Fidedignidade: Preserve o tom, a linguagem e o contexto das respostas originais, garantindo que o discurso reflita fielmente as opiniões expressas pelos indivíduos.

    Estrutura do DSC:

    Introdução: Apresentação do tema do discurso de forma natural.

    Desenvolvimento: Exposição das ideias centrais de maneira fluida, conectando-as logicamente.

    Conclusão: Síntese do discurso, reforçando a mensagem principal e finalizando de forma coerente.

    **IMPORTANTE:**  
    Retorne **apenas o texto do discurso transformado**.  
    **Não inclua comentários, explicações, introduções, títulos ou qualquer texto adicional.**

    Respostas fornecidas:
    ${texto}
  `;

//   try {
//     const response = await axios.post("http://127.0.0.1:11434/api/generate", {
//         model: "mistral",
//         prompt: prompt,
//         stream: false
//     });

    try {
        const response = await ClientGemini(prompt);
        console.log("Resposta da API:", response);

        // Pegue o texto correto do objeto de resposta
        const textoDiscurso =
            typeof response === "string"
                ? response
                : response.response || response.data?.response || JSON.stringify(response);

        // Salva o discurso transformado em um arquivo .txt
        const nomeArquivoDiscurso = `discurso-transformado-${Date.now()}.txt`;
        const caminhoDiscurso = path.resolve("uploads", "discursos-criados", nomeArquivoDiscurso);

        fs.writeFileSync(caminhoDiscurso, textoDiscurso, "utf-8");

        const gerarRelatorio = req.body.relatorio === "true";

        let relatorio = null;
        let nomeArquivoRelatorio = null;
        if (gerarRelatorio) {
            relatorio = `
===== RELATÓRIO: ANTES E DEPOIS =====

ANTES:
${texto}

-----------------------------------------------------------------------------------------------------------------

DEPOIS:
${textoDiscurso}
`;
            nomeArquivoRelatorio = `relatorio-antes-depois-${Date.now()}.txt`;
            const dirRelatorio = path.resolve("uploads", "relatorios");
            if(!fs.existsSync(dirRelatorio)){
                fs.mkdirSync(dirRelatorio, {recursive: true});
            }
            const caminhoRelatorio = path.join(dirRelatorio, nomeArquivoRelatorio);
            fs.writeFileSync(caminhoRelatorio, relatorio, "utf-8");
        }

        return res.json({
            discursoTransformado: textoDiscurso,
            arquivoSalvo: nomeArquivoDiscurso,
            relatorio: relatorio,
            arquivoRelatorio: nomeArquivoRelatorio
        });
    } catch (error) {
        console.error("Erro na chamada da API:", error.response ? error.response.data : error.message);
        return res.status(500).json({ erro: "Erro ao processar o discurso." });
    }
};

// Middleware de upload para a rota
export const uploadMiddleware = upload.single("arquivo");

// Cria o diretório uploads/discursos-criados se não existir
const dir = path.resolve("uploads", "discursos-criados");
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// função de download (converte .txt para PDF e envia)
export const baixarDiscurso = (req, res) => {
    try {
        // raw param pode vir codificado/decodificado dependendo do front
        const raw = req.params.filename || "";
        console.log("baixarDiscurso called, raw param:", raw);

        // decode uma vez para ter o nome original
        let filename;
        try {
            filename = decodeURIComponent(raw);
        } catch (e) {
            filename = raw;
        }
        console.log("baixarDiscurso resolved filename:", filename);

        const txtPath = path.resolve("uploads", "discursos-criados", filename);
        console.log("checando arquivo em:", txtPath, "exists:", fs.existsSync(txtPath));

        if (!fs.existsSync(txtPath)) {
            return res.status(404).send("Arquivo não encontrado.");
        }

        const baseName = path.parse(filename).name;
        const pdfFileName = `${baseName}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);

        const doc = new PDFDocument({ autoFirstPage: false });
        doc.pipe(res);

        const content = fs.readFileSync(txtPath, "utf-8");
        doc.addPage();
        doc.font("Times-Roman").fontSize(12).text(content, {
            width: 510,
            align: "left",
            lineGap: 4
        });

        doc.end();
    } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        if (!res.headersSent) res.status(500).send("Erro ao gerar PDF.");
    }
};

export const baixarRelatorio = (req, res) => {
    try {
        // raw param pode vir codificado/decodificado dependendo do front
        const raw = req.params.filename || "";
        console.log("baixarRelatorio called, raw param:", raw);

        // decode uma vez para ter o nome original
        let filename;
        try {
            filename = decodeURIComponent(raw);
        } catch (e) {
            filename = raw;
        }
        console.log("baixarRelatorio resolved filename:", filename);

        const txtPath = path.resolve("uploads", "relatorios", filename);
        console.log("checando arquivo em:", txtPath, "exists:", fs.existsSync(txtPath));

        if (!fs.existsSync(txtPath)) {
            return res.status(404).send("Arquivo não encontrado.");
        }

        const baseName = path.parse(filename).name;
        const pdfFileName = `${baseName}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);

        const doc = new PDFDocument({ autoFirstPage: false });
        doc.pipe(res);

        const content = fs.readFileSync(txtPath, "utf-8");
        doc.addPage();
        doc.font("Times-Roman").fontSize(12).text(content, {
            width: 510,
            align: "left",
            lineGap: 4
        });

        doc.end();
    } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        if (!res.headersSent) res.status(500).send("Erro ao gerar PDF.");
    }
};

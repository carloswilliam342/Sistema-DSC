import axios from "axios";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import mammoth from "mammoth";
import upload  from "../config/upload.js"; // Importa o middleware de upload
import pdfParse from "pdf-parse";
import ClientGemini from "../client.js"; // Importa o cliente Gemini
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

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
        const tipoRelatorio = req.body.tipoRelatorio || "geral";

        if (gerarRelatorio) {
            // Primeiro, define o nome base do arquivo de relatório
            nomeArquivoRelatorio = `relatorio-${tipoRelatorio}-${Date.now()}.txt`;

            if (tipoRelatorio === "geral") {
                relatorio = `
===== RELATÓRIO: ANTES E DEPOIS =====

ANTES:
${texto}

-----------------------------------------------------------------------------------------------------------------

DEPOIS:
${textoDiscurso}
`;
            } else if (tipoRelatorio === "estruturado") {
                // Prompt para relatório estruturado
                const promptEstruturado = `
                    Extraia dos textos abaixo os dados dos entrevistados.
                    Retorne os dados em um formato de array JSON. Cada objeto no array deve representar um entrevistado e conter as seguintes chaves: "nome", "idade", "cidade", "estadoCivil", "renda", "genero", "resposta".
                    Se um campo não for encontrado para um entrevistado, use o valor null ou uma string vazia.
                    A sua resposta deve conter APENAS o array JSON, sem nenhum texto adicional, comentários ou a palavra "json" antes ou depois.

                    Texto:
                    ${texto}
                `;

                const respostaEstruturada = await ClientGemini(promptEstruturado);
                let dadosEntrevistados = [];
                let relatorioEstruturado = "";

                try {
                    if (respostaEstruturada && typeof respostaEstruturada === 'string') {
                        // Limpa a resposta da IA para garantir que seja um JSON válido
                        const jsonResponse = respostaEstruturada.replace(/```json/g, '').replace(/```/g, '').trim();
                        dadosEntrevistados = JSON.parse(jsonResponse);

                        // Formata o texto do relatório a partir dos dados JSON
                        relatorioEstruturado = dadosEntrevistados.map((p, index) => `
Entrevistado ${index + 1}
Nome: ${p.nome || 'N/A'}
Idade: ${p.idade || 'N/A'}
Cidade: ${p.cidade || 'N/A'}
Estado civil: ${p.estadoCivil || 'N/A'}
Renda: ${p.renda || 'N/A'}
Gênero: ${p.genero || 'N/A'}
Resposta/opinião: "${p.resposta || 'N/A'}"
                        `).join('\n');
                    } else {
                        // Se a resposta for nula ou não for uma string, lança um erro para o bloco catch
                        throw new Error("A resposta da IA para o relatório estruturado veio vazia ou em formato inválido.");
                    }
                } catch (e) {
                    console.error("Erro ao parsear JSON da IA, usando resposta como texto puro:", e);
                    // Fallback: se o JSON falhar ou a resposta for nula, usa a resposta como texto (ou uma mensagem de erro)
                    relatorioEstruturado = respostaEstruturada;
                }
                
    // Monte o relatório incluindo o "DEPOIS"
    relatorio = `
===== RELATÓRIO ESTRUTURADO POR ENTREVISTADO =====

${relatorioEstruturado}

-----------------------------------------------------------------------------------------------------------------

DEPOIS:
${textoDiscurso}
`;
                // Se houver dados para gráficos, salva o JSON e anexa o nome ao arquivo de relatório
                if (dadosEntrevistados.length > 0) {
                    const dadosGraficosPath = path.resolve("uploads", "relatorios", `dados-graficos-${Date.now()}.json`);
                    fs.writeFileSync(dadosGraficosPath, JSON.stringify(dadosEntrevistados));
                    // Anexa a informação do arquivo de dados ao nome do relatório para a URL de download
                    nomeArquivoRelatorio += `&dados=${path.basename(dadosGraficosPath)}`;
                }
            }

            const dirRelatorio = path.resolve("uploads", "relatorios");            
            const caminhoRelatorio = path.join(dirRelatorio, nomeArquivoRelatorio.split('&dados=')[0]); // Salva usando apenas o nome do arquivo .txt
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

// Cria os diretórios de upload se não existirem
const uploadsDir = path.resolve("uploads");
const discursosCriadosDir = path.join(uploadsDir, "discursos-criados");
const relatoriosDir = path.join(uploadsDir, "relatorios");

if (!fs.existsSync(discursosCriadosDir)) {
    fs.mkdirSync(discursosCriadosDir, { recursive: true });
}
if (!fs.existsSync(relatoriosDir)) {
    fs.mkdirSync(relatoriosDir, { recursive: true });
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

export const baixarRelatorio = async (req, res) => {
    try {        
        const rawParam = req.params.filename || "";
        console.log("baixarRelatorio called, raw param:", rawParam);

        // Decodifica o parâmetro da URL
        const decodedParam = decodeURIComponent(rawParam);

        // Separa o nome do arquivo de relatório e o nome do arquivo de dados dos gráficos
        const [filename, dadosGraficosFile] = decodedParam.split('&dados=');

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
            width: 470, // Diminuir a largura para caber na página A4 padrão
            align: "left",
            lineGap: 4
        });

        // Se houver dados para gráficos, gera e insere no PDF
        if (dadosGraficosFile) {
            const dadosPath = path.resolve("uploads", "relatorios", dadosGraficosFile);
            if (fs.existsSync(dadosPath)) {
                const dadosEntrevistados = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));

                doc.addPage().fontSize(16).text('Análise Gráfica dos Entrevistados', { align: 'center' });
                doc.moveDown(2);

                // Gera e insere o gráfico de Gênero
                const bufferGraficoGenero = await gerarGrafico(dadosEntrevistados, 'genero', 'pie', 'Distribuição por Gênero');
                if (bufferGraficoGenero) {
                    doc.image(bufferGraficoGenero, {
                        fit: [450, 300],
                        align: 'center',
                        valign: 'center'
                    });
                    doc.moveDown(2);
                }

                // Gera e insere o gráfico de Cidade
                const bufferGraficoCidade = await gerarGrafico(dadosEntrevistados, 'cidade', 'bar', 'Distribuição por Cidade');
                if (bufferGraficoCidade) {
                    doc.addPage().fontSize(16).text('Distribuição por Cidade', { align: 'center' }).moveDown(2);
                    doc.image(bufferGraficoCidade, {
                        fit: [450, 400],
                        align: 'center',
                        valign: 'center'
                    });
                }

                // Limpa o arquivo JSON temporário
                fs.unlinkSync(dadosPath);
            }
        }

        doc.end();
    } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        if (!res.headersSent) res.status(500).send("Erro ao gerar PDF.");
    }
};

/**
 * Gera um gráfico a partir dos dados dos entrevistados.
 * @param {Array} dados - O array de objetos dos entrevistados.
 * @param {string} chave - A chave do objeto a ser analisada (ex: 'genero', 'cidade').
 * @param {string} tipo - O tipo de gráfico ('pie' ou 'bar').
 * @param {string} titulo - O título do gráfico.
 * @returns {Promise<Buffer|null>} - Um buffer de imagem PNG ou null se não houver dados.
 */
async function gerarGrafico(dados, chave, tipo, titulo) {
    const contagem = dados.reduce((acc, item) => {
        const valor = item[chave] || 'Não informado';
        acc[valor] = (acc[valor] || 0) + 1;
        return acc;
    }, {});

    if (Object.keys(contagem).length === 0) return null;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 400, backgroundColour: 'white' });

    const configuration = {
        type: tipo,
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                label: titulo,
                data: Object.values(contagem),
                backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
            }],
        },
        options: { plugins: { title: { display: true, text: titulo, font: { size: 18 } } } }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

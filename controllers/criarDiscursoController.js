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
    console.log('processarDiscurso called - relatorio:', req.body.relatorio, 'tipoRelatorio:', req.body.tipoRelatorio, 'file present:', !!req.file);

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
    Você receberá respostas a uma pergunta aberta, e deverá construir um Discurso do Sujeito Coletivo (DSC) conforme as seguintes etapas obrigatórias:

Identifique e destaque todas as Expressões-Chave (ECHs): trechos literais, curtos, que trazem diretamente o posicionamento e/ou argumento central do respondente. As ECHs devem ser apresentadas de forma explícita, listadas e destacadas.

Agrupe as ECHs por sentido semelhante e construa a Ideia Central (IC): uma síntese objetiva, curta, descritiva, preferencialmente usando palavras diferentes das ECHs, que represente o sentido coletivo daquele grupo de ECHs.

Agrupe as ICs em Categorias: identifique e nomeie cada Categoria de sentido ou posicionamento encontrado no conjunto de respostas.

Monte o DSC para cada Categoria: use as ECHs daquela categoria para criar um texto coeso, narrativo, na primeira pessoa do singular, curto, objetivo, sem redundâncias e sem interpretações, apenas unindo as ECHs. O DSC deve ter no máximo 4-5 frases, mantendo o essencial das manifestações coletivas, evitando qualquer síntese interpretativa extensa.

Exiba a estrutura completa: Para cada Categoria, apresente (a) a lista de ECHs originais; (b) a IC derivada; (c) o nome da Categoria; (d) o DSC correspondente.

Não faça interpretação, justificativa ou análise teórica no corpo do DSC – apenas a montagem objetiva e literal dos sentidos presentes nas ECHs.

Exemplo (apenas ilustrativo, não copie):
Categoria: Barreira de acesso

ECHs: "não tenho dinheiro para pagar", "os custos são altos", "não consigo bolsa"

IC: Dificuldade financeira prejudica o acesso

DSC: Não consigo participar porque não tenho dinheiro suficiente, os custos são altos e as bolsas são poucas.

Siga rigorosamente cada etapa do procedimento para garantir a fidelidade à técnica do DSC, apresentando um texto final curto, coeso, objetivo e representativo do pensamento coletivo.

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
                const promptEstruturado = `
Analise o texto abaixo e forneça APENAS:

1. DADOS DOS ENTREVISTADOS
Liste para cada entrevistado:
- Nome
- Idade
- Cidade
- Estado civil
- Renda
- Gênero
- Cor da Pele
- Resposta/opinião

2. ANÁLISE GERAL
- Identifique e liste as 5 palavras mais mencionadas entre todos os respondentes (excluindo artigos e preposições)
- Extraia um tópico central que representa a opinião coletiva dos entrevistados

3. ANÁLISE POR GÊNERO
- Liste os pontos comuns nas respostas dos entrevistados do gênero masculino
- Liste os pontos comuns nas respostas das entrevistadas do gênero feminino
- Destaque as principais diferenças de perspectiva entre os gêneros (se houver)

IMPORTANTE: Retorne APENAS a análise estruturada acima, não gere nenhum discurso adicional.

Texto para análise:
${texto}
`;
                const respostaEstruturada = await ClientGemini(promptEstruturado);
                const relatorioEstruturado = typeof respostaEstruturada === "string"
                    ? respostaEstruturada
                    : respostaEstruturada.response || respostaEstruturada.data?.response || JSON.stringify(respostaEstruturada);

                console.log('relatorioEstruturado length:', (relatorioEstruturado || '').length);

                // Extrai os dados dos entrevistados do relatório estruturado (mais tolerante a formatos variados)
                function extractInterviewData(text) {
                    const entries = [];
                    const lines = text.split(/\r?\n/);
                    let current = {};

                    const pushCurrent = () => {
                        if (Object.keys(current).length > 0) {
                            // normalize keys
                            if (!current.resposta) current.resposta = current.resposta || '';
                            entries.push(current);
                            current = {};
                        }
                    };

                    for (let rawLine of lines) {
                        const line = rawLine.trim();
                        if (!line) { // blank line separates entries
                            pushCurrent();
                            continue;
                        }

                        // Normalize: remove leading bullets/asterisks and inline bold asterisks so labels like
                        // '* Cidade: Recife' or '**Cidade**: Recife' are matched.
                        const normalized = line
                            .replace(/^[\s\-\u2022\*]+/, '') // remove leading bullets/spaces/asterisks
                            .replace(/\*\*/g, '') // remove bold markers
                            .replace(/\*/g, '')
                            .trim();

                        // Try several simpler patterns on the normalized line
                        let m;
                        m = normalized.match(/^Nome\s*[:\-]\s*(.+)/i);
                        if (m) { current.nome = m[1].trim(); continue; }

                        m = normalized.match(/^Idade\s*[:\-]\s*(.+)/i);
                        if (m) { current.idade = m[1].trim(); continue; }

                        m = normalized.match(/^Cidade\s*[:\-]\s*(.+)/i);
                        if (m) { current.cidade = m[1].trim(); continue; }

                        m = normalized.match(/^(?:Estado\s*civil|Estado\s*Civil)\s*[:\-]\s*(.+)/i);
                        if (m) { current.estadoCivil = m[1].trim(); continue; }

                        m = normalized.match(/^Renda\s*[:\-]\s*(.+)/i);
                        if (m) { current.renda = m[1].trim(); continue; }

                        m = normalized.match(/^G[eê]nero\s*[:\-]\s*(.+)/i);
                        if (m) { current.genero = m[1].trim(); continue; }

                        // resposta/opinião pode aparecer em linhas com prefix 'Resposta' or 'Resposta/opinião'
                        m = normalized.match(/^(?:Resposta(?:\/opini[oõ]o)?|Resposta \/ Opini[oõ]o)\s*[:\-]\s*(.+)/i);
                        if (m) { current.resposta = m[1].trim(); pushCurrent(); continue; }

                        // If a line seems like a free-form answer (long text) and we already have a nome, attach as resposta
                        if (line.length > 40 && current.nome && !current.resposta) {
                            current.resposta = (current.resposta ? current.resposta + '\n' : '') + line;
                            pushCurrent();
                        }
                    }
                    // push last
                    pushCurrent();
                    return entries;
                }

                const dadosEntrevistados = extractInterviewData(relatorioEstruturado || '');
                console.log('dadosEntrevistados extraidos:', dadosEntrevistados.length);

                // Salva os dados dos entrevistados em um arquivo temporário para os gráficos
                const dadosGraficosFile = `dados_graficos_${Date.now()}.json`;
                const caminhoDadosGraficos = path.join(relatoriosDir, dadosGraficosFile);
                try {
                    fs.mkdirSync(relatoriosDir, { recursive: true });
                    fs.writeFileSync(caminhoDadosGraficos, JSON.stringify(dadosEntrevistados, null, 2), 'utf-8');
                    console.log('dados graficos salvos em', caminhoDadosGraficos);
                } catch (e) {
                    console.error('Erro ao salvar dados graficos em', caminhoDadosGraficos, e);
                }

                // Atualiza o nome do arquivo do relatório para incluir o arquivo de dados dos gráficos
                nomeArquivoRelatorio = `${nomeArquivoRelatorio}&dados=${dadosGraficosFile}`;

                // Monta o relatório final com o DSC separado
                relatorio = `
===== RELATÓRIO ESTRUTURADO E ANÁLISE DE DISCURSO =====

${relatorioEstruturado}

-----------------------------------------------------------------------------------------------------------------

DEPOIS:
${textoDiscurso}
                `;
            }

            const dirRelatorio = path.resolve("uploads", "relatorios");            
            const caminhoRelatorio = path.join(dirRelatorio, nomeArquivoRelatorio.split('&dados=')[0]); // Salva usando apenas o nome do arquivo .txt
            try {
                fs.mkdirSync(dirRelatorio, { recursive: true });
                fs.writeFileSync(caminhoRelatorio, relatorio, "utf-8");
                console.log('relatorio salvo em', caminhoRelatorio);
            } catch (e) {
                console.error('Erro ao salvar relatorio em', caminhoRelatorio, e);
            }
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

// Configura os diretórios necessários
const uploadsDir = path.resolve("uploads");
const discursosCriadosDir = path.join(uploadsDir, "discursos-criados");
const relatoriosDir = path.join(uploadsDir, "relatorios");
const dirRelatorio = relatoriosDir; // Adiciona a declaração do dirRelatorio aqui

// Middleware de upload para a rota
export const uploadMiddleware = upload.single("arquivo");

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
                console.log('baixarRelatorio: dadosEntrevistados length =', Array.isArray(dadosEntrevistados) ? dadosEntrevistados.length : 'nao-array');

                doc.addPage().fontSize(16).text('Análise Gráfica dos Entrevistados', { align: 'center' });
                doc.moveDown(2);

                // Gera e insere o gráfico de Gênero (com proteção e debug)
                try {
                    const bufferGraficoGenero = await gerarGrafico(dadosEntrevistados, 'genero', 'pie', 'Distribuição por Gênero');
                    if (bufferGraficoGenero && bufferGraficoGenero.length > 0) {
                        // salva debug
                        try {
                            const debugPath = path.join(relatoriosDir, `debug-grafico-genero-${Date.now()}.png`);
                            fs.writeFileSync(debugPath, bufferGraficoGenero);
                            console.log('debug grafico genero salvo em', debugPath);
                        } catch (e) {
                            console.warn('falha ao salvar debug grafico genero', e.message);
                        }

                        doc.image(bufferGraficoGenero, {
                            fit: [450, 300],
                            align: 'center',
                            valign: 'center'
                        });
                        doc.moveDown(2);
                    } else {
                        console.warn('bufferGraficoGenero vazio ou invalido');
                    }
                } catch (errGraf) {
                    console.error('Erro ao gerar/inserir grafico genero:', errGraf);
                }

                // Gera e insere o gráfico de Cidade (com proteção e debug)
                try {
                    const bufferGraficoCidade = await gerarGrafico(dadosEntrevistados, 'cidade', 'bar', 'Distribuição por Cidade');
                    if (bufferGraficoCidade && bufferGraficoCidade.length > 0) {
                        try {
                            const debugPath2 = path.join(relatoriosDir, `debug-grafico-cidade-${Date.now()}.png`);
                            fs.writeFileSync(debugPath2, bufferGraficoCidade);
                            console.log('debug grafico cidade salvo em', debugPath2);
                        } catch (e) {
                            console.warn('falha ao salvar debug grafico cidade', e.message);
                        }

                        doc.addPage().fontSize(16).text('Distribuição por Cidade', { align: 'center' }).moveDown(2);
                        doc.image(bufferGraficoCidade, {
                            fit: [450, 400],
                            align: 'center',
                            valign: 'center'
                        });
                    } else {
                        console.warn('bufferGraficoCidade vazio ou invalido');
                    }
                } catch (errGraf2) {
                    console.error('Erro ao gerar/inserir grafico cidade:', errGraf2);
                }

                // Limpa o arquivo JSON temporário
                try {
                    fs.unlinkSync(dadosPath);
                } catch (e) {
                    console.warn('falha ao remover dadosPath:', e.message);
                }
            } else {
                console.warn('dadosGraficosFile informado, mas arquivo nao existe:', dadosPath);
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

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
        width: 600, 
        height: 400, 
        backgroundColour: 'white',
        chartCallback: (ChartJS) => {
            // Opcional: personalização global do Chart.js
            ChartJS.defaults.responsive = true;
            ChartJS.defaults.maintainAspectRatio = false;
        }
    });

    const configuration = {
        type: tipo,
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                label: titulo,
                data: Object.values(contagem),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#47C49A', '#9C27B0', '#2196F3', '#FF5722'
                ],
                borderColor: 'white',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: titulo,
                    font: { size: 18, weight: 'bold' },
                    padding: 20
                },
                legend: {
                    display: true,
                    position: tipo === 'pie' ? 'right' : 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            }
        }
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    try {
        console.log(`gerarGrafico: chave=${chave} tipo=${tipo} labels=${Object.keys(contagem).length} bufferBytes=${buffer?.length || 0}`);
    } catch (e) {
        console.error('Erro ao logar info do gráfico', e);
    }
    return buffer;
}

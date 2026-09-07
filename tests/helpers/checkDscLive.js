// Verificação opcional do provedor real com dados inteiramente fictícios.
// Requer a prévia local de previewDsc.js em execução. Não toca no MySQL.
const endpoint = "http://127.0.0.1:3107/dsc/criar-discurso/api/pesquisas";
const input = {
  titulo: "Calibração fictícia do prompt DSC", pergunta: "Como avalia o acesso e atendimento?",
  categorias: [{ nome: "Dificuldade financeira", descricao: "Impossibilidade de pagar o atendimento." }, { nome: "Demora no transporte", descricao: "Espera pelo transporte até o serviço." }, { nome: "Avaliação do atendimento", descricao: "Opiniões sobre a qualidade do atendimento." }],
  respondentes: [
    { nome: "Pessoa fictícia A", depoimento: "Não consigo pagar a consulta. O ônibus demora muito. Sou bem atendida." },
    { nome: "Pessoa fictícia B", depoimento: "Não tenho dinheiro para a consulta. Fui mal atendida." },
    { nome: "Pessoa fictícia C", depoimento: "Espero muito pelo ônibus." },
  ],
};
async function post(url, body) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro);
  return data;
}
const study = await post(endpoint, input);
console.log("Análise validada:", JSON.stringify(study.analise));
const generated = await post(`${endpoint}/${study.id}/gerar`, { revisao: study.revisao, revisado: true, analise: study.analise });
console.log("Geração validada:", JSON.stringify(generated.versoes.at(-1).discursos));

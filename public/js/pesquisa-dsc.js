(() => {
  "use strict";
  const root = document.getElementById("dsc-app");
  if (!root) return;
  const base = root.dataset.base || "";
  const $ = id => document.getElementById(id);
  let step = 0, study = null, page = 0, busy = false;
  let categories = [{ nome: "", descricao: "" }];
  let respondents = [{ nome: "", depoimento: "" }];
  let review = null;
  const clone = value => JSON.parse(JSON.stringify(value));
  const demographics = { nome: "Nome ou pseudônimo *", idade: "Idade", sexo: "Sexo", cor: "Cor/raça", renda: "Renda", escolaridade: "Grau de instrução", cidade: "Cidade", estado: "Estado", regiao: "Região", ocupacao: "Principal atividade profissional", outros: "Outros dados" };
  function el(tag, text, className) { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; }
  function button(text, action, style = "btn btn-outline-secondary") { const b = el("button", text, style); b.type = "button"; b.addEventListener("click", action); return b; }
  function field(label, value, onInput, { multiline = false, required = false, max = 200, type = "text" } = {}) {
    const wrap = el("label", label, "dsc-field");
    const input = el(multiline ? "textarea" : "input", null, "form-control");
    if (!multiline) input.type = type;
    input.value = value || ""; input.required = required; input.maxLength = max;
    if (type === "number") { input.min = "0"; input.max = "130"; input.step = "1"; }
    input.addEventListener("input", () => onInput(input.value)); wrap.append(input); return wrap;
  }
  function option(select, value, text) { const o = el("option", text); o.value = value; select.append(o); }
  function status(message = "", error = false) { const n = $("dsc-status"); n.textContent = message; n.className = message ? `dsc-status${error ? " dsc-error" : ""}` : ""; }
  async function api(path, body, isFile = false) {
    const response = await fetch(`${base}/criar-discurso/api${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", headers: body === undefined || isFile ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : isFile ? body : JSON.stringify(body) });
    if (response.redirected || !(response.headers.get("content-type") || "").includes("application/json")) throw new Error("Sua sessão expirou ou o servidor não respondeu. Entre novamente antes de tentar.");
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Não foi possível concluir a operação.");
    return data;
  }
  async function run(message, action) {
    if (busy) return;
    busy = true; status(message); root.setAttribute("aria-busy", "true");
    const controls = [...root.querySelectorAll("button, input, textarea, select")].map(node => [node, node.disabled]);
    controls.forEach(([node]) => { node.disabled = true; });
    try { await action(); status(); }
    catch (error) { status(error.message, true); $("dsc-status").focus(); }
    finally { busy = false; root.removeAttribute("aria-busy"); controls.forEach(([node, disabled]) => { node.disabled = disabled; }); }
  }
  function showStep(next) {
    step = next;
    $("historico-painel").hidden = true; $("estudo-painel").hidden = false;
    root.querySelectorAll("[data-step]").forEach(n => { n.hidden = Number(n.dataset.step) !== step; });
    [...$("etapas").children].forEach((n, i) => { if (i === step) n.setAttribute("aria-current", "step"); else n.removeAttribute("aria-current"); });
    $("estudo-form").hidden = step > 2;
    // Campos de etapas anteriores continuam preservados, mas não bloqueiam a validação nativa.
    root.querySelectorAll("#estudo-form [data-step] input, #estudo-form [data-step] textarea").forEach(n => { n.disabled = Number(n.closest("[data-step]").dataset.step) !== step; });
    $("voltar-etapa").hidden = step === 0; $("avancar-etapa").textContent = step === 2 ? "Analisar depoimentos" : "Continuar";
  }
  function renderCategories() {
    const holder = $("categorias-editor"); holder.replaceChildren();
    categories.forEach((c, i) => {
      const card = el("div", null, "dsc-card"); card.append(el("h3", `Categoria ${i + 1}`));
      card.append(field("Nome *", c.nome, v => { c.nome = v; }, { required: true, max: 120 }));
      card.append(field("Descrição / critério de inclusão", c.descricao, v => { c.descricao = v; }, { multiline: true, max: 1000 }));
      if (categories.length > 1) card.append(button("Remover categoria", () => { categories.splice(i, 1); renderCategories(); }));
      holder.append(card);
    });
  }
  function renderRespondents() {
    const holder = $("respondentes-editor"); holder.replaceChildren();
    respondents.forEach((r, i) => {
      const card = el("div", null, "dsc-card"); card.append(el("h3", `Respondente ${i + 1}`)); const grid = el("div", null, "dsc-grid");
      for (const [key, label] of Object.entries(demographics)) grid.append(field(label, r[key], v => { r[key] = v; }, { required: key === "nome", type: key === "idade" ? "number" : "text", max: key === "outros" ? 1000 : 200 }));
      card.append(grid);
      if (respondents.length > 1) card.append(button("Remover respondente", () => { if (r.depoimento && !window.confirm("Remover este respondente e seu depoimento do formulário?")) return; respondents.splice(i, 1); renderRespondents(); }));
      holder.append(card);
    });
  }
  function renderStatements() {
    $("pergunta-resumo").textContent = $("pergunta-estudo").value;
    const holder = $("depoimentos-editor"); holder.replaceChildren();
    respondents.forEach((r, i) => {
      const card = el("div", null, "dsc-card"); card.append(el("h3", `${i + 1}. ${r.nome}`));
      const input = field("Depoimento original *", r.depoimento, v => { r.depoimento = v; }, { multiline: true, required: true, max: 20000 }); card.append(input);
      const label = el("label", "Importar depoimento", "dsc-field"); const upload = el("input", null, "form-control"); upload.type = "file"; upload.accept = ".txt,.docx,.pdf";
      upload.addEventListener("change", () => {
        const file = upload.files[0]; if (!file) return;
        if (r.depoimento && !window.confirm("Substituir o depoimento atual pelo texto importado?")) { upload.value = ""; return; }
        run("Extraindo o texto do arquivo…", async () => { const form = new FormData(); form.append("arquivo", file); const data = await api("/importar", form, true); r.depoimento = data.texto; input.querySelector("textarea").value = data.texto; upload.value = ""; });
      }); label.append(upload); card.append(label); holder.append(card);
    });
  }
  function invalidateApproval() { $("confirmar-revisao").checked = false; }
  function renderReview() {
    invalidateApproval(); const holder = $("revisao-editor"); holder.replaceChildren();
    review.respondentes.forEach(row => {
      const r = study.dados.respondentes.find(x => x.id === row.id);
      const card = el("article", null, "dsc-card"); card.append(el("h3", `${r.id} · ${r.nome}`), el("p", r.depoimento, "dsc-quote"));
      card.append(field("Palavras-chave (separadas por vírgula)", row.palavrasChave.join(", "), value => { row.palavrasChave = value.split(",").map(w => w.trim()).filter(Boolean); invalidateApproval(); }, { max: 1500 }));
      if (!row.unidades.length) card.append(el("p", "Nenhuma expressão-chave identificada. Confira o depoimento e adicione um trecho, se necessário.", "dsc-note"));
      row.unidades.forEach((u, i) => {
        const unit = el("div", null, "dsc-unit");
        unit.append(field("Expressão-chave — trecho literal", u.expressao, v => { u.expressao = v; invalidateApproval(); }, { multiline: true, max: 20000 }));
        unit.append(field("Ideia central", u.ideiaCentral, v => { u.ideiaCentral = v; invalidateApproval(); }, { max: 1000 }));
        const label = el("label", "Categoria revisada", "dsc-field"); const select = el("select", null, "form-select"); option(select, "", "Sem categoria / fora do recorte");
        study.dados.categorias.forEach(c => option(select, c.id, c.nome)); select.value = u.categoriaId || "";
        select.addEventListener("change", () => { u.categoriaId = select.value || null; invalidateApproval(); }); label.append(select); unit.append(label);
        unit.append(el("p", `Justificativa da sugestão: ${u.justificativa || "Classificação manual."}`, "dsc-muted"));
        if (u.ancoragem) unit.append(el("p", `Ancoragem: ${u.ancoragem.descricao} — “${u.ancoragem.expressao}”`, "dsc-quote"));
        unit.append(button("Remover expressão-chave", () => { row.unidades.splice(i, 1); renderReview(); })); card.append(unit);
      });
      card.append(button("+ Adicionar expressão-chave", () => { row.unidades.push({ expressao: "", ideiaCentral: "", ancoragem: null, categoriaId: null, justificativa: "Incluída pelo pesquisador." }); renderReview(); })); holder.append(card);
    });
  }
  function currentVersion() { return study.versoes.find(v => v.numero === Number($("filtro-versao").value)) || study.versoes.at(-1); }
  function renderResults(reset = false) {
    $("resultado-titulo").textContent = study.titulo;
    if (reset) {
      for (const id of ["filtro-versao", "filtro-categoria", "filtro-respondente"]) $(id).replaceChildren();
      [...study.versoes].reverse().forEach(v => option($("filtro-versao"), v.numero, `Versão ${v.numero} · ${new Date(v.criadaEm).toLocaleString("pt-BR")}`));
      option($("filtro-categoria"), "", "Todas as categorias"); study.dados.categorias.forEach(c => option($("filtro-categoria"), c.id, c.nome));
      option($("filtro-respondente"), "", "Todos os respondentes"); study.dados.respondentes.forEach(r => option($("filtro-respondente"), r.id, `${r.id} · ${r.nome}`));
      $("sugestao-original").hidden = true;
    }
    const version = currentVersion(); if (!version) return;
    $("resultado-contexto").textContent = `${study.dados.pergunta} · DSCs com até 10 palavras. Os filtros consultam esta versão e não geram um novo discurso.`;
    $("exportar-pdf").href = `${base}/criar-discurso/api/pesquisas/${study.id}/pdf?versao=${version.numero}`;
    const category = $("filtro-categoria").value, person = $("filtro-respondente").value, content = $("filtro-conteudo").value;
    const holder = $("resultado-conteudo"); holder.replaceChildren();
    if (content === "dsc") {
      version.discursos.filter(d => (!category || d.categoriaId === category) && (!person || d.fontes.some(f => f.respondenteId === person))).forEach(d => {
        const card = el("article", null, "dsc-card"); card.append(el("h3", study.dados.categorias.find(c => c.id === d.categoriaId).nome));
        card.append(el("p", d.texto || `Revisão necessária: ${d.pendencia}`, d.texto ? "dsc-discourse" : "dsc-note"));
        card.append(el("p", `${d.palavras} palavras · ${new Set(d.fontes.map(f => f.respondenteId)).size} respondente(s) contribuinte(s)`, "dsc-muted"));
        d.fontes.forEach(f => { const row = version.analise.respondentes.find(r => r.id === f.respondenteId); const u = row.unidades.find(x => x.id === f.unidadeId); const r = study.dados.respondentes.find(x => x.id === f.respondenteId); card.append(el("p", `${r.nome} · ECH: “${u.expressao}” · IC: ${u.ideiaCentral}`, "dsc-quote")); }); holder.append(card);
      });
    } else {
      study.dados.respondentes.filter(r => !person || r.id === person).forEach(r => {
        const a = version.analise.respondentes.find(x => x.id === r.id); const units = a.unidades.filter(u => !category || u.categoriaId === category);
        if (category && !units.length) return;
        const card = el("article", null, "dsc-card"); card.append(el("h3", `${r.id} · ${r.nome}`));
        if (["expressao", "ideiaCentral", "ancoragem"].includes(content)) {
          units.forEach(u => { const value = content === "ancoragem" ? (u.ancoragem ? `${u.ancoragem.descricao} — “${u.ancoragem.expressao}”` : "Não identificada") : u[content]; card.append(el("p", value, "dsc-quote"), el("p", study.dados.categorias.find(c => c.id === u.categoriaId)?.nome || "Sem categoria", "dsc-muted")); });
          if (!units.length) card.append(el("p", "Não identificado."));
        } else card.append(el("p", content === "palavrasChave" ? a.palavrasChave.join(", ") || "Não identificadas" : r[content] || "Não informado", content === "depoimento" ? "dsc-quote" : ""));
        holder.append(card);
      });
    }
    if (!holder.children.length) holder.append(el("p", "Nenhum resultado para estes filtros.", "dsc-note"));
  }
  async function history() {
    await run("Carregando histórico…", async () => {
      const data = await api(`/pesquisas?pagina=${page}`); $("estudo-painel").hidden = true; $("historico-painel").hidden = false;
      const holder = $("historico-lista"); holder.replaceChildren();
      data.pesquisas.forEach(p => { const card = el("article", null, "dsc-card"); card.append(el("h3", p.titulo), el("p", `${new Date(p.createdAt).toLocaleString("pt-BR")} · ${p.revisao ? `${p.revisao} versão(ões)` : "Análise aguardando revisão"}`, "dsc-muted")); card.append(button("Abrir estudo", () => run("Abrindo estudo…", async () => { study = await api(`/pesquisas/${p.id}`); review = clone(study.analise); if (study.versoes.length) { renderResults(true); showStep(4); } else { renderReview(); showStep(3); } }))); holder.append(card); });
      if (!data.pesquisas.length) holder.append(el("p", "Nenhum estudo salvo ainda. Comece em Novo estudo."));
      const nav = $("historico-paginacao"); nav.replaceChildren(); if (page > 0) nav.append(button("Anterior", () => { page--; history(); })); if ((page + 1) * 20 < data.total) nav.append(button("Próxima", () => { page++; history(); }));
    });
  }
  $("adicionar-categoria").onclick = () => { if (categories.length >= 30) return status("O estudo permite até 30 categorias.", true); categories.push({ nome: "", descricao: "" }); renderCategories(); };
  $("adicionar-respondente").onclick = () => { if (respondents.length >= 100) return status("O estudo permite até 100 respondentes.", true); respondents.push({ nome: "", depoimento: "" }); renderRespondents(); };
  $("voltar-etapa").onclick = () => showStep(step - 1);
  $("estudo-form").onsubmit = event => {
    event.preventDefault(); if (busy) return;
    if (step === 0) { const names = categories.map(c => c.nome.trim().toLocaleLowerCase("pt-BR")); if (names.some(n => !n) || new Set(names).size !== names.length) return status("Informe categorias com nomes diferentes.", true); status(); renderRespondents(); showStep(1); }
    else if (step === 1) { renderStatements(); showStep(2); }
    else run("Analisando expressões-chave, ideias centrais e categorias…", async () => { study = await api("/pesquisas", { titulo: $("titulo-estudo").value, pergunta: $("pergunta-estudo").value, categorias: categories, respondentes: respondents }); review = clone(study.analise); $("comando-geracao").value = ""; renderReview(); showStep(3); });
  };
  $("gerar-dsc").onclick = () => {
    if (!$("confirmar-revisao").checked) return status("Confirme a revisão antes de gerar os DSCs.", true);
    run("Gerando e validando um DSC de até 10 palavras por categoria…", async () => { study = await api(`/pesquisas/${study.id}/gerar`, { revisao: study.revisao, analise: review, revisado: true, comando: $("comando-geracao").value }); review = clone(study.analise); renderResults(true); showStep(4); });
  };
  $("editar-entradas").onclick = () => { $("titulo-estudo").value = study.dados.titulo; $("pergunta-estudo").value = study.dados.pergunta; categories = clone(study.dados.categorias); respondents = clone(study.dados.respondentes); renderCategories(); renderRespondents(); renderStatements(); showStep(0); status("Ao analisar novamente, será criado outro estudo. O estudo anterior permanece no histórico."); };
  $("redefinir-dsc").onclick = () => { review = clone(study.analise); $("comando-geracao").value = ""; renderReview(); showStep(3); };
  $("ver-sugestao").onclick = () => { const holder = $("sugestao-original"); holder.hidden = !holder.hidden; holder.replaceChildren(el("h3", "Sugestão original da IA (antes da revisão)")); study.sugestaoOriginal.respondentes.forEach(r => { const card = el("div", null, "dsc-card"); card.append(el("h3", study.dados.respondentes.find(p => p.id === r.id).nome)); r.unidades.forEach(u => card.append(el("p", `ECH: ${u.expressao} · IC: ${u.ideiaCentral} · Categoria: ${study.dados.categorias.find(c => c.id === u.categoriaId)?.nome || "Sem categoria"}`))); holder.append(card); }); };
  for (const id of ["filtro-versao", "filtro-conteudo", "filtro-categoria", "filtro-respondente"]) $(id).onchange = () => renderResults();
  $("abrir-historico").onclick = () => { if ((step < 3 || step === 3) && !$("estudo-painel").hidden && !window.confirm("Abrir o histórico? Alterações ainda não analisadas ou geradas não serão salvas.")) return; page = 0; history(); };
  $("novo-estudo").onclick = () => { if (!$("estudo-painel").hidden && !window.confirm("Iniciar novo estudo? Alterações ainda não analisadas ou geradas não serão salvas.")) return; study = null; review = null; categories = [{ nome: "", descricao: "" }]; respondents = [{ nome: "", depoimento: "" }]; $("titulo-estudo").value = ""; $("pergunta-estudo").value = ""; renderCategories(); renderRespondents(); renderStatements(); showStep(0); status(); };
  window.addEventListener("beforeunload", event => { if (busy) { event.preventDefault(); event.returnValue = ""; } });
  renderCategories(); renderRespondents(); showStep(0); if (root.dataset.history === "true") history();
})();

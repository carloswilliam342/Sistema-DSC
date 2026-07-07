# DSC — Discurso do Sujeito Coletivo 🗣️

Plataforma web do IFMA para construção e análise de discursos com base na metodologia do **Discurso do Sujeito Coletivo (DSC)**: transforma relatos individuais em discursos coletivos representativos, a partir de ideias centrais extraídas de textos qualitativos (com apoio de IA).

> **📌 Este README é o ponto de partida para quem vai desenvolver/manter o sistema.**
> Para colocar em **produção no servidor do IFMA**, veja o [GUIA_IMPLANTACAO_IFMA.md](GUIA_IMPLANTACAO_IFMA.md).
> Se você está assumindo o projeto numa **migração de servidor**, pule direto para a seção [🔄 Migração de servidor](#-migração-de-servidor).

---

## 🚀 Funcionalidades

- ✍️ Cadastro e submissão de discursos individuais
- 🧠 Transformação automática para Discurso do Sujeito Coletivo (via API do Google Gemini)
- 🔍 Análise de ideias centrais e ancoragens
- 📊 Relatórios comparativos (antes/depois) e relatório estruturado com gráficos
- 👤 Autenticação por sessão e perfis de usuário (Estudante / Pesquisador)
- ❤️ Discursos favoritos
- 📥 Exportação de discursos e relatórios em PDF e Excel

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Runtime | **Node.js 18+** (o projeto usa **ES Modules** — `"type": "module"`) |
| Backend | Express 4 |
| Views | Express-Handlebars + Bootstrap 5 |
| ORM | Sequelize 6 |
| Banco (produção) | **MySQL 8** |
| Banco (testes) | **SQLite em memória** (automático quando `NODE_ENV=test`) |
| IA | Google Gemini (`@google/genai`, modelo `gemini-2.5-flash`) |
| Testes | Vitest 3 + Supertest |
| Processo (prod) | PM2 (ver guia de implantação) |

---

## 📂 Estrutura de pastas

```
Sistema-DSC/
├── app.js            → Configura o app Express (middlewares, rotas, views). NÃO sobe servidor.
├── server.js         → Ponto de entrada: conecta no banco e chama app.listen().
├── client.js         → Cliente da API Gemini (com retry automático em erro 503/429).
├── config/
│   ├── database.js   → Instância do Sequelize (MySQL em prod / SQLite em teste).
│   ├── config.js     → Config do Sequelize-CLI (usado SÓ pelas migrations).
│   └── upload.js     → Configuração do multer (upload de arquivos).
├── controllers/      → Lógica das rotas.
├── models/           → Modelos Sequelize (tabelas do banco).
├── routes/           → Definição das rotas Express.
├── views/            → Templates Handlebars (layouts/ e partials/).
├── public/           → Estáticos (CSS, JS, imagens).
├── uploads/          → Arquivos enviados/gerados em runtime (parcialmente no .gitignore).
├── utils/            → Funções puras reutilizáveis e testáveis.
├── migrations/       → Migrations do Sequelize-CLI (schema do banco).
├── tests/            → Testes automatizados (Vitest).
├── .env              → Segredos e config locais (NÃO versionado — ver .env.example).
└── .env.example      → Modelo do .env.
```

---

## ⚙️ Setup local (desenvolvimento)

### 1. Pré-requisitos
- Node.js 18+ e npm
- MySQL 8 rodando localmente (ou acesso a um)
- Git

### 2. Clonar e instalar
```bash
git clone https://github.com/carloswilliam342/Sistema-DSC.git
cd Sistema-DSC
npm install
```

### 3. Criar o arquivo `.env`
Copie o modelo e preencha:
```bash
cp .env.example .env
```
Veja a tabela de variáveis em [🔐 Variáveis de ambiente](#-variáveis-de-ambiente).

### 4. Criar o banco MySQL
```sql
CREATE DATABASE dsc_ifma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Criar as tabelas (migrations)
```bash
npx sequelize-cli db:migrate
```

### 6. Rodar a aplicação
```bash
npm start
```
Acesse **http://localhost:3000**.

---

## 🔐 Variáveis de ambiente

Configuradas no arquivo `.env` (na raiz). **Esse arquivo está no `.gitignore` e nunca deve ser commitado.**

| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_HOST` | Host do MySQL | `127.0.0.1` |
| `DB_USER` | Usuário do MySQL | `root` |
| `DB_PASSWORD` | Senha do MySQL | `sua_senha` |
| `DB_NAME` | Nome do banco | `dsc_ifma` |
| `GEMINI_API_KEY` | Chave da API do Google Gemini (obtida em https://aistudio.google.com/app/apikey) | `AIza...` |
| `SESSION_SECRET` | Chave que assina o cookie de sessão. **Obrigatória em produção** (a sessão é persistida no MySQL). Gere uma aleatória: `openssl rand -hex 32` | `f3a9...` |
| `BASE_PATH` | Prefixo de subdiretório onde o app é servido (ex: `/dsc` se rodar em `fabrica.ifma.edu.br/dsc`). Vazio = servido na raiz | `/dsc` ou vazio |
| `NODE_ENV` | Ambiente | `development` / `production` / `test` |
| `PORT` | Porta do servidor | `3000` |

> ⚠️ **Segurança:** a `GEMINI_API_KEY` e o `SESSION_SECRET` são sensíveis. Na migração de servidor, transfira o `.env` por um canal seguro (nunca por git, e-mail ou chat). Se a `GEMINI_API_KEY` já tiver vazado em algum lugar, **gere uma nova** no Google AI Studio. Defina um `SESSION_SECRET` forte e único em produção — sem ele, as sessões dos usuários ficam vulneráveis.

---

## 🧪 Testes

O projeto tem uma suíte automatizada (Vitest) cobrindo **acima de 80%** do código.

| Comando | O que faz |
|---|---|
| `npm test` | Roda todos os testes uma vez |
| `npm run coverage` | Roda os testes + relatório de cobertura (falha se cair abaixo da meta) |
| `npm run test:watch` | Re-roda automaticamente ao salvar arquivos (modo desenvolvimento) |

**Relatório visual de cobertura:** após `npm run coverage`, abra `coverage/index.html` no navegador.

**Como os testes funcionam (resumo):**
- `tests/utils/`, `tests/controllers/`, `tests/routes/` → **testes unitários** com dependências (banco, IA, arquivos) *mockadas*. Rápidos; validam a lógica.
- `tests/integration/` → **testes de integração** que sobem um **SQLite em memória** e rodam SQL de verdade (pegam erros de schema, constraints e associações que os mocks não pegam).

> ⚠️ **Atenção ao ambiente dual-node (importante neste projeto):** o `sqlite3` é um módulo **nativo**, compilado para a versão de Node que rodou o `npm install`.
> **Sempre rode os testes com `npm test` / `npm run coverage`** (que usam o mesmo Node). Evite `npx vitest` diretamente — se o `npx` resolver para outra versão de Node, o `sqlite3` dá erro de ABI.
> Se isso acontecer após trocar de versão do Node, rode `npm rebuild sqlite3`.

---

## 🏛️ Arquitetura e decisões importantes

Pontos que **não são óbvios** e vão te poupar tempo:

### `app.js` vs `server.js`
- **`app.js`** monta o Express (rotas, middlewares, views) e **exporta o app** — sem subir servidor. É isso que os testes de integração importam.
- **`server.js`** importa o `app`, conecta no banco e chama `app.listen()`. É o arquivo que o `npm start` / PM2 executam.
- **Regra:** rota nova, middleware novo → vai em `app.js`. Nunca coloque `app.listen()` fora do `server.js`.

### `config/database.js` tem dois modos
- `NODE_ENV=test` → **SQLite em memória** (para os testes).
- Qualquer outro → **MySQL** (usando as variáveis do `.env`).

### `config/database.js` vs `config/config.js` (não confundir)
- **`database.js`** → usado pela **aplicação em runtime** (todos os models importam daqui).
- **`config.js`** → usado **apenas pelo Sequelize-CLI** (comando `db:migrate`). Também lê o `.env`.

### Migrations vs auto-sync
- As **migrations** (`npx sequelize-cli db:migrate`) são a fonte oficial do schema.
- O `server.js` também chama `sequelize.sync()` no boot, que cria tabelas faltantes a partir dos models. Útil em dev, mas **em produção confie nas migrations** para mudanças de schema.

### Deploy em subdiretório (`BASE_PATH`)
- Todas as rotas são montadas num `router` sob o prefixo `BASE_PATH` (definido em `config/basePath.js` a partir da env). Ex: com `BASE_PATH=/dsc`, o login fica em `/dsc/login`.
- Nas views, use `{{basePath}}/...` para links absolutos e o helper `{{withBase ...}}` para caminhos dinâmicos (ex: imagens vindas do banco). Caminhos **relativos** (`images/x.jpg`) já funcionam sob qualquer prefixo.
- Com `BASE_PATH` vazio (padrão), tudo é servido na raiz — inclusive nos testes.

---

## ⚠️ Pontos de atenção / armadilhas conhecidas

| Item | O que saber |
|---|---|
| **`pdf-parse`** | Importado via `pdf-parse/lib/pdf-parse.js` (e não `"pdf-parse"`) de propósito — o entrypoint padrão do pacote tem um bug que trava o boot tentando ler um PDF de teste inexistente. Não "corrija" esse import. |
| **Gemini 503/429** | O `client.js` já tem retry automático com backoff (3 tentativas). Se mesmo assim falhar, é sobrecarga do próprio Google — esperar ou trocar de modelo. |
| **Sessão** | A sessão é persistida no **MySQL** (`express-mysql-session`) e assinada com `SESSION_SECRET`. Em `NODE_ENV=test` cai automaticamente para store em memória (não conecta no MySQL durante os testes). Lembre de definir um `SESSION_SECRET` forte em produção. |
| **Imagens** | As imagens de `public/images/` já foram otimizadas (PNGs pesados → JPEG). Ao adicionar imagens novas, prefira JPEG e evite arquivos de vários MB. |
| **Pastas de upload** | `uploads/` precisa de permissão de escrita para o usuário que roda o Node. Subpastas geradas em runtime estão no `.gitignore`. |

---

## 🔄 Migração de servidor

Checklist para levar o sistema para um novo servidor (do dev que sai para o dev que assume):

**No servidor novo, garanta:**
- [ ] Node.js 18+, npm, MySQL 8+, Git e PM2 instalados
- [ ] Porta da aplicação (padrão 3000) liberada / com proxy reverso configurado (ver guia)

**Passos:**
1. [ ] `git clone https://github.com/carloswilliam342/Sistema-DSC.git`
2. [ ] `npm install`
3. [ ] Criar o `.env` (transferir os valores do servidor antigo por canal seguro — **não** via git). Ajuste `NODE_ENV=production`.
4. [ ] Criar o banco: `CREATE DATABASE dsc_ifma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
5. [ ] **Migrar os dados existentes** do MySQL antigo (dump + restore):
   ```bash
   # No servidor ANTIGO:
   mysqldump -u root -p dsc_ifma > dsc_ifma_backup.sql
   # No servidor NOVO (após criar o banco):
   mysql -u root -p dsc_ifma < dsc_ifma_backup.sql
   ```
6. [ ] Rodar migrations pendentes: `npx sequelize-cli db:migrate`
7. [ ] **Copiar as pastas de upload** do servidor antigo — os arquivos enviados por usuários ficam **no disco, não no banco**, e estão no `.gitignore` (não vêm pelo `git clone`). São **duas** pastas:
   - **`public/uploads/`** → imagens de discursos (`imagens-discursos/`) e fotos de perfil (`profile-images/`)
   - **`uploads/`** → discursos criados (`discursos-criados/`) e relatórios (`relatorios/`)
   ```bash
   # Ex. (rsync do servidor antigo para o novo):
   rsync -av usuario@servidor-antigo:/caminho/dsc/public/uploads/ ./public/uploads/
   rsync -av usuario@servidor-antigo:/caminho/dsc/uploads/ ./uploads/
   ```
8. [ ] Validar localmente: `npm test` (deve passar tudo) e depois `npm start`
9. [ ] Subir com PM2 (ver [GUIA_IMPLANTACAO_IFMA.md](GUIA_IMPLANTACAO_IFMA.md))
10. [ ] Testar no navegador: login, criação de discurso (valida a integração com o Gemini) e download de PDF

> 💡 Os itens que a maioria esquece numa migração: **os dados do MySQL** (passo 5) e as **pastas de upload** `public/uploads/` + `uploads/` (passo 7). O código no git não traz nenhum dos dois — se as imagens dos discursos não carregarem em produção, quase sempre é a `public/uploads/` que não foi copiada.

---

## 🔁 Rotina de atualização (deploy contínuo)

```bash
git pull origin main
npm install                      # se o package.json mudou
npx sequelize-cli db:migrate     # se houver migrations novas
npm test                         # confirme que está tudo verde antes de reiniciar
pm2 restart sistema-dsc
```

---

## 📄 Documentação relacionada
- [GUIA_IMPLANTACAO_IFMA.md](GUIA_IMPLANTACAO_IFMA.md) — implantação em produção (PM2, Nginx, permissões).

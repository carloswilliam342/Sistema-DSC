# Sistema-DSC
Plataforma web para construção e análise de discursos com base na metodologia do Discurso do Sujeito Coletivo (DSC).

# DSC - Discurso do Sujeito Coletivo 🗣️

Sistema web desenvolvido para aplicar a metodologia do Discurso do Sujeito Coletivo (DSC), que visa transformar relatos individuais em discursos coletivos representativos, com base em ideias centrais extraídas de textos qualitativos.

## 🚀 Funcionalidades

- ✍️ Cadastro e submissão de discursos individuais
- 🧠 Transformação automática para discurso do sujeito coletivo (DSC)
- 🔍 Análise de ideias centrais e ancoragens
- 📊 Geração de relatórios comparativos (antes e depois)
- 📁 Área de recursos com materiais de apoio (guia do usuário, estudo de caso)
- 👤 Sistema de autenticação e perfis de usuário
- ❤️ Salvamento de discursos favoritos
- 📚 Página explicativa "Como funciona", "Sobre o DSC" e "Recursos"

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js + Express
- **Frontend:** Handlebars + Bootstrap 5
- **Banco de Dados:** MySQL
- **Autenticação:** Sessões
- **Outros:** HTML5, CSS3, JavaScript

## 📂 Estrutura de Pastas

📁 controllers/
📁 models/
📁 routes/
📁 views/
📁 public/
📁 arquivos/ → Arquivos como PDF, DOCX para download
📄 server.js → Arquivo principal do servidor


## 📚 Como usar

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/dsc.git
cd dsc
```

### 2. Instalar dependência
```bash
npm install
```
### 3. Configurar banco de dados
Crie um banco MySQL e configure seu arquivo .env com as seguintes variáveis:
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=dsc_db
```

### 4. Iniciar o servidor
```bash
npm start
```

### 5. Acessar no navegador
```bash
http://localhost:3000

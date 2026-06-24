# Guia de Implantação e Configuração - Sistema DSC (IFMA)

Este guia detalha o passo a passo para a implantação do Sistema-DSC (Discurso do Sujeito Coletivo) no servidor de produção do IFMA.

## 📋 Pré-requisitos do Servidor

Antes de iniciar a implantação, certifique-se de que o servidor (Linux/Windows) possui os seguintes softwares instalados:
- **Node.js** (Recomendado v18+ ou superior)
- **NPM** (Gerenciador de pacotes do Node)
- **MySQL Server** (Recomendado v8.0+)
- **Git** (Para versionamento e obtenção do projeto)
- **PM2** (Para manter a aplicação rodando em segundo plano. Para instalar: `npm install -g pm2`)

---

## 🚀 Passo a Passo de Implantação

### 1. Obtenção do Código-Fonte
Acesse o servidor via terminal/SSH e clone o repositório na pasta onde a aplicação será hospedada (ex: `/var/www/dsc` em Linux ou `C:\inetpub\wwwroot\dsc` em Windows):

```bash
git clone <URL_DO_REPOSITORIO> dsc-ifma
cd dsc-ifma
```

### 2. Instalação das Dependências
Instale as bibliotecas e pacotes necessários do projeto executando o comando abaixo. O comando irá ler o arquivo `package.json` e instalar tudo na pasta `node_modules`.

```bash
npm install
```

> [!NOTE]
> O sistema utiliza módulos ES (`"type": "module"`). O servidor Node.js já deve suportar esta sintaxe nativamente.

### 3. Configuração do Banco de Dados (MySQL)
Acesse o seu banco de dados MySQL e crie o schema que será utilizado pela aplicação:

```sql
CREATE DATABASE dsc_ifma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Crie o arquivo de configuração de variáveis de ambiente (`.env`) na raiz do projeto e preencha as suas credenciais:

```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=dsc_ifma

# Porta onde o Node.js irá rodar (opcional, padrão costuma ser 3000)
PORT=3000
NODE_ENV=production
```

### 4. Executando as Migrations (Criando Tabelas)
O sistema utiliza o Sequelize ORM. Para gerar as tabelas de banco de dados e suas colunas de forma automática e padronizada, execute as *migrations*:

```bash
npx sequelize-cli db:migrate
```
*Isto irá ler os arquivos na pasta `migrations/` e criar o esquema no banco MySQL.*

### 5. Iniciar a Aplicação (Usando PM2)
O PM2 garante que o sistema fique rodando em segundo plano e reinicie automaticamente se o servidor for reiniciado ou caso a aplicação sofra *crash*.

```bash
# 1. Iniciar o servidor Node
pm2 start server.js --name "sistema-dsc"

# 2. Salvar a lista de processos para o boot do sistema
pm2 save

# 3. Configurar inicialização junto com o SO (Ele te dará um script para rodar no terminal)
pm2 startup
```

> [!TIP]
> **Comandos úteis do PM2 para o dia a dia:**
> - `pm2 logs sistema-dsc` (Ver os logs de acesso e erros em tempo real)
> - `pm2 restart sistema-dsc` (Reiniciar a aplicação, útil após atualizações)
> - `pm2 status` (Verificar memória/CPU e quais projetos estão online)

### 6. Configuração de Proxy Reverso Nginx (Recomendado para Produção)
Para que o sistema seja acessível diretamente pelas portas padrão da web (80 para HTTP ou 443 para HTTPS) e sem que o usuário precise digitar a porta local da aplicação, você pode utilizar o Nginx como intermediário. 

Crie um arquivo de configuração no Nginx (ex: `/etc/nginx/sites-available/dsc-ifma`):

```nginx
server {
    listen 80;
    server_name seu_dominio.ifma.edu.br; # Substitua pelo IP ou Domínio oficial

    location / {
        proxy_pass http://localhost:3000; # A mesma porta configurada no .env e no Node
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site e reinicie o serviço do nginx:
```bash
ln -s /etc/nginx/sites-available/dsc-ifma /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 📂 Pastas com Permissões Especiais

Se houver funcionalidades no sistema de upload de arquivos de usuários, algumas pastas locais podem precisar de permissões de gravação e leitura liberadas para o usuário do sistema operacional que executa o Node:
- `uploads/`
- *(Qualquer outra pasta criada em que os usuários enviem arquivos estáticos em tempo de execução)*.

## 🔄 Rotina de Atualização (Deploy Contínuo)

Quando houver novas atualizações de código por parte dos desenvolvedores no GitHub, o processo de atualização do servidor é bastante prático:

```bash
# 1. Baixar os novos códigos
git pull origin main

# 2. Atualizar possíveis novos pacotes Node (caso o package.json tenha mudado)
npm install

# 3. Rodar migrations caso o banco de dados tenha sido atualizado
npx sequelize-cli db:migrate

# 4. Reiniciar a aplicação
pm2 restart sistema-dsc
```

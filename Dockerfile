FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
    build-essential python3 pkg-config libcairo2-dev libpango1.0-dev libjpeg62-turbo-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

# node:20-bookworm-slim já traz um usuário não-root (uid/gid 1000) pronto pra
# uso. Roda a aplicação com ele em vez de root.
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "server.js"]

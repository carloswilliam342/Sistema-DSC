#!/bin/bash
# Roda automaticamente no primeiro boot do container (volume vazio), via
# mecanismo padrão da imagem oficial do MySQL (/docker-entrypoint-initdb.d).
# Cria dois usuários com privilégios separados por responsabilidade:
#   - DB_APP_USER: só DML (SELECT/INSERT/UPDATE/DELETE). É quem o `app` usa
#     em runtime; não precisa nem deve poder alterar schema.
#   - DB_MIGRATE_USER: DDL completo. É quem o serviço `migrate` usa pra
#     rodar as migrations (create/alter/drop table).
set -euo pipefail

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
  CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
  GRANT SELECT, INSERT, UPDATE, DELETE ON \`${MYSQL_DATABASE}\`.* TO '${DB_APP_USER}'@'%';

  CREATE USER IF NOT EXISTS '${DB_MIGRATE_USER}'@'%' IDENTIFIED BY '${DB_MIGRATE_PASSWORD}';
  GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${DB_MIGRATE_USER}'@'%';

  FLUSH PRIVILEGES;
EOSQL

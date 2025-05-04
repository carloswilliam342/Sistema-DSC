import 'dotenv/config';

export default {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || "dsc_ifma",
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql"
  },
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "dsc_ifma",
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql"
  },
  production: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "meu_banco_prod",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql"
  }
};

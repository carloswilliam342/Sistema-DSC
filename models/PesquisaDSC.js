import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// O mysql2 pode devolver colunas JSON como texto, dependendo da versão e das
// opções do driver. Os getters mantêm o restante da aplicação independente
// desse detalhe e também funcionam no SQLite dos testes, que já devolve objetos.
function jsonValue(instance, field) {
  const value = instance.getDataValue(field);
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

const PesquisaDSC = sequelize.define("PesquisaDSC", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuarioId: { type: DataTypes.INTEGER, allowNull: false },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  dados: { type: DataTypes.JSON, allowNull: false, get() { return jsonValue(this, "dados"); } },
  analise: { type: DataTypes.JSON, allowNull: false, get() { return jsonValue(this, "analise"); } },
  sugestaoOriginal: { type: DataTypes.JSON, allowNull: false, get() { return jsonValue(this, "sugestaoOriginal"); } },
  versoes: { type: DataTypes.JSON, allowNull: false, defaultValue: [], get() { return jsonValue(this, "versoes"); } },
  revisao: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: "PesquisasDSC", indexes: [{ fields: ["usuarioId", "createdAt"] }] });

export default PesquisaDSC;

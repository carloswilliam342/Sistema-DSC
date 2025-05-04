import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Depoimento = sequelize.define("Depoimento", {
  texto: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  autor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipoUsuario: {
    type: DataTypes.STRING,
    allowNull: false, // "Estudante" ou "Pesquisador"
  },
});

export default Depoimento;
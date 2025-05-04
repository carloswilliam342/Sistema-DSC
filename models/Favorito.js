import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Discurso from "./Discurso.js";

const Favorito = sequelize.define("Favorito", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  discursoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

Favorito.belongsTo(Discurso, {
  foreignKey: 'discursoId',
  as: 'Discurso'
});

export default Favorito;
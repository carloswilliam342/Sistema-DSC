import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Discurso = sequelize.define("Discurso", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imagem: {
        type: DataTypes.STRING, // Caminho da imagem
        allowNull: true // Para discursos antigos sem imagem
    },
    dataCriacao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

export default Discurso;

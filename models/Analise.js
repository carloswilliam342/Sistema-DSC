import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"

const Analise = sequelize.define('Analise', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    data_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    data_fim: {
        type: DataTypes.DATE,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'analises',
    timestamps: true
});

export default Analise;
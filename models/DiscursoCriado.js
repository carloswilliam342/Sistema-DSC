import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DiscursoCriado = sequelize.define("Discurso", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    textoOriginal: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    textoTransformado: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    mostrarRelatorio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

export default DiscursoCriado;

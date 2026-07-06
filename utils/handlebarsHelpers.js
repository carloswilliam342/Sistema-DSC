// Helpers do Handlebars usados nas views.
// Extraídos para um módulo próprio para permitir testes unitários.
import { BASE_PATH } from "../config/basePath.js";

export const handlebarsHelpers = {
  eq: function (v1, v2) {
    return v1 === v2;
  },
  json: function (context) {
    return JSON.stringify(context);
  },
  // Prefixa caminhos absolutos com o BASE_PATH (deploy em subdiretório).
  withBase: function (value) {
    if (typeof value === "string" && value.startsWith("/")) {
      return BASE_PATH + value;
    }
    return value;
  },
  truncate: function (str, len) {
    if (!str) return "";
    str = String(str);
    return str.length > len ? str.substring(0, len) + "..." : str;
  },
  formatDate: function (date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  },
  ifCond: function (v1, operator, v2, options) {
    switch (operator) {
      case "==":
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "!=":
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case "!==":
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case "<":
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=":
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">":
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=":
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "&&":
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case "||":
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },
};

export default handlebarsHelpers;

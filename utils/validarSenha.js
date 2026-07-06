// Regra de senha forte:
// mínimo 8 caracteres, com pelo menos 1 letra minúscula, 1 maiúscula,
// 1 número e 1 símbolo.
export const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

/**
 * Valida se a senha atende aos requisitos mínimos de segurança.
 * @param {string} senha
 * @returns {boolean} true se a senha for válida
 */
export function validarSenha(senha) {
  if (typeof senha !== "string") return false;
  return SENHA_REGEX.test(senha.trim());
}

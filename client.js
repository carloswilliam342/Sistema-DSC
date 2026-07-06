import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

const MAX_TENTATIVAS = 3;
const ESPERA_BASE_MS = 1000;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function ClientGemini(prompt) {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      // 503 (modelo sobrecarregado) e 429 (limite de requisições) costumam ser transitórios
      const transitorio = error.status === 503 || error.status === 429;
      if (!transitorio || tentativa === MAX_TENTATIVAS) {
        throw error;
      }
      const espera = ESPERA_BASE_MS * 2 ** (tentativa - 1);
      console.warn(`Gemini indisponível (tentativa ${tentativa}/${MAX_TENTATIVAS}), tentando novamente em ${espera}ms...`);
      await esperar(espera);
    }
  }
}

import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

const MAX_TENTATIVAS = 3;
const ESPERA_BASE_MS = 1000;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function ClientGemini(prompt, config) {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      // Gemini 3.x emite console.warn sobre thoughtSignature (thinking interno).
      // Suprimimos temporariamente para não poluir o log do servidor.
      const warnOriginal = console.warn;
      console.warn = (...args) => {
        if (typeof args[0] === "string" && args[0].includes("thoughtSignature")) return;
        warnOriginal.apply(console, args);
      };
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            ...(config || {}),
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
      } finally {
        console.warn = warnOriginal;
      }
      // Sanitize response: remove leading/trailing whitespace and normalize newlines
      // to prevent validation failures due to model formatting quirks.
      return response.text?.trim().replace(/\r?\n/g, " ");
    } catch (error) {
      // 429 sem billing: cota gratuita acabou → não adianta fazer retry
      if (error.status === 429) {
        throw new Error("Cota gratuita da IA esgotada. Configure billing ou aguarde o reset mensal.");
      }
      // 503 (modelo sobrecarregado) costuma ser transitório
      const transitorio = error.status === 503;
      if (!transitorio || tentativa === MAX_TENTATIVAS) {
        throw error;
      }
      const espera = ESPERA_BASE_MS * 2 ** (tentativa - 1);
      console.warn(`Gemini indisponível (tentativa ${tentativa}/${MAX_TENTATIVAS}), tentando novamente em ${espera}ms...`);
      await esperar(espera);
    }
  }
}

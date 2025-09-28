// Wrapper para OpenAI SDK con Structured Outputs

import OpenAI from "openai";
import { LLM_DEFAULTS, pickEffort, Effort, AgentKind, StepType } from "./llm.config";

let openai: OpenAI;

export async function llmJson<T>(args: {
  system: string;
  user: string;
  schema: object;
  agent: AgentKind;
  stepType?: StepType;
  model?: string;
  effort?: Effort;
}): Promise<T> {
  const model = args.model ?? LLM_DEFAULTS.model;
  const effort = pickEffort({ agent: args.agent, stepType: args.stepType, override: args.effort });

  // Configurar parámetros según el esfuerzo
  const effortConfig = {
    low: { temperature: 0.3, max_tokens: 500 },
    medium: { temperature: 0.7, max_tokens: 1000 },
    high: { temperature: 0.9, max_tokens: 2000 },
    minimal: { temperature: 0.1, max_tokens: 300 }
  };

  const config = effortConfig[effort];

  try {
    // Verificar que la API key esté configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY no está configurada");
      console.error("📝 Crea un archivo .env en la raíz del proyecto con:");
      console.error("   OPENAI_API_KEY=sk-tu-clave-aqui");
      throw new Error("OPENAI_API_KEY no está configurada. Crea un archivo .env con tu clave de OpenAI");
    }

    // Inicializar OpenAI client si no existe
    if (!openai) {
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("✅ OpenAI client inicializado correctamente");
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: args.schema as any,
          strict: true
        }
      },
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content) as T;
  } catch (error) {
    console.error("Error in llmJson:", error);
    
    // Mensaje más específico para errores comunes
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Error de API Key de OpenAI. Verifica que OPENAI_API_KEY esté configurada correctamente.");
      } else if (error.message.includes("quota")) {
        throw new Error("Error de cuota de OpenAI. Verifica tu cuenta y límites de uso.");
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
    
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Inicialização oficial do novo SDK
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { respostasQuiz, imagensBase64 } = await request.json();

    const instrucaoSistema = `
      Você é um dermatologista especialista. Analise as fotos e o quiz do paciente.
      Aqui está o nosso catálogo de produtos disponíveis:
      - ID: prod-01 | Nome: Gel de Limpeza | Indicado para pele oleosa.
      - ID: prod-02 | Nome: Hidratante Profundo | Indicado para pele seca.
      - ID: prod-03 | Nome: Sérum Vitamina C | Indicado para manchas e linhas de expressão.
      
      Recomende apenas produtos que estejam nessa lista.
    `;

    // Formata o array de imagens base64 para o formato que o novo SDK espera
    const partesImagens = imagensBase64.map((base64String: string) => {
      const dadosPuros = base64String.includes(",") 
        ? base64String.split(",")[1] 
        : base64String;

      return {
        inlineData: {
          data: dadosPuros,
          mimeType: "image/jpeg" // No novo SDK mudou de contentType para mimeType
        }
      };
    });

    const prompt = `
      Respostas do Quiz do Paciente: ${JSON.stringify(respostasQuiz)}
      Por favor, faça a análise baseando-se no quiz e nas imagens anexadas.
    `;

    // Chamada oficial usando o novo SDK (@google/genai)
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      // No novo SDK, combinamos texto e mídias dentro do array contents
      contents: [prompt, ...partesImagens],
      config: {
        systemInstruction: instrucaoSistema,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            analisePele: { type: "STRING" },
            recomendacoesGerais: { type: "STRING" },
            produtosRecomendados: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  nome: { type: "STRING" },
                  motivoUso: { type: "STRING" }
                },
                required: ["id", "nome", "motivoUso"]
              }
            }
          },
          required: ["analisePele", "recomendacoesGerais", "produtosRecomendados"]
        }
      }
    });

    const respostaTexto = response.text;

    if (!respostaTexto) {
      throw new Error("A API do Gemini retornou uma resposta vazia.");
    }

    return NextResponse.json(JSON.parse(respostaTexto));

  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
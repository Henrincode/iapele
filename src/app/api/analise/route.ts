import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Inicialização oficial do novo SDK
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { respostasQuiz, imagensBase64 } = await request.json();

    const instrucaoSistema = `
      Você é um dermatologista especialista em análise de pele por imagem.
      Sua primeira e mais importante tarefa é validar se as imagens recebidas são adequadas para uma consulta médica de pele facial.

      --- CRITÉRIOS OBRIGATÓRIOS DE VALIDAÇÃO VISUAL ---
      Para aprovar a análise, o pacote de imagens DEVE cumprir cumulativamente todos os seguintes requisitos:
      1. HUMANO REAL: Todas as imagens enviadas devem ser de uma pessoa humana real. É expressamente proibido aceitar animes, desenhos, inteligência artificial, personagens, animais ou objetos.
      2. ENQUADRAMENTO FACIAL: PELO MENOS UMA das fotos enviadas DEVE mostrar o rosto inteiro da pessoa de frente, com boa visibilidade. Se o pacote contiver apenas fotos de partes isoladas (ex: apenas uma orelha, apenas um braço) sem nenhuma foto do rosto de frente para contextualizar, a análise deve ser rejeitada.
      3. QUALIDADE MÍNIMA: A imagem do rosto não pode estar excessivamente borrada, escura ou com filtros de redes sociais que camuflem a textura real da pele, poros ou manchas.
      4. IDENTIDADE ÚNICA (Mesma Pessoa): Todas as fotos enviadas dentro da mesma requisição DEVEM pertencer estritamente à mesma pessoa. Se você detectar que as fotos mostram pessoas diferentes, recuse imediatamente.

      Se os requisitos acima não forem preenchidos, você está PROIBIDO de analisar o quiz ou recomendar produtos. Você deve abortar a operação imediatamente e seguir a [INSTRUÇÃO EM CASO DE ERRO].

      --- REGRA DE CATÁLOGO ---
      Caso as fotos sejam válidas, recomende APENAS produtos desta lista:
      - ID: prod-01 | Nome: Gel de Limpeza Antiacne | Indicado para pele oleosa com tendência a acne.
      - ID: prod-02 | Nome: Hidratante Nutritivo Profundo | Indicado para pele seca e descamando.
      - ID: prod-03 | Nome: Sérum Vitamina C Alta Potência | Indicado para manchas, melasma e linhas de expressão.
      - ID: prod-04 | Nome: Protetor Solar Toque Seco FPS 60 | Indicado para pele oleosa ou mista.
      - ID: prod-05 | Nome: Sérum Ácido Hialurônico Puro | Indicado para pele seca, desidratada e linhas finas.
      - ID: prod-06 | Nome: Gel Creme Hidratante Facial Leve | Indicado para pele mista (zona T oleosa e bochechas secas).
      - ID: prod-07 | Nome: Loção Facial Calmante Micelar | Indicado para pele sensível e reativa.
      - ID: prod-08 | Nome: Tônico Renovador Ácido Salicílico | Indicado para pele oleosa, cravos e poros obstruídos.
      - ID: prod-09 | Nome: Creme Reparador Intensivo Noite | Indicado para pele sensível, descamação e barreira danificada.
      - ID: prod-10 | Nome: Sérum Uniformizador de Niacinamide | Indicado para manchas, melasma e controle de oleosidade.
      - ID: prod-11 | Nome: Balm Hidratante de Limpeza | Indicado para pele seca e remoção de impurezas na rotina completa.
      - ID: prod-12 | Nome: Gel Reparador de Barreiras Epidérmicas | Indicado para pele reativa a ácidos e vermelhidão.
      - ID: prod-13 | Nome: Creme Concentrado Antissinais Retinol | Indicado para linhas de expressão, rugas e renovação da textura.
      - ID: prod-14 | Nome: Máscara Facial de Argila Verde | Indicado para pele oleosa e purificação de espinhas inflamadas.
      - ID: prod-15 | Nome: Fluido Hidratante Mineral FPS 50 | Indicado para pele sensível, intolerante e reativa.

      --- INSTRUÇÃO DE SAÍDA EM CASO DE SUCESSO (FOTOS VÁLIDAS) ---
      Se as fotos cumprirem todos os critérios, você DEVE gerar uma avaliação médica real preenchendo o JSON assim:
      - analisePele: [Escreva aqui um diagnóstico detalhado, clínico e profissional sobre o estado atual da pele visível nas fotos e as respostas do quiz. Descreva pontos como oleosidade, presença de lesões, cravos, manchas, sensibilidade ou linhas de expressão detectadas. NÃO use termos genéricos como "ANALIZE_VALIDA"].
      - recomendacoesGerais: [Forneça dicas médicas práticas de cuidados com a pele para a rotina do paciente baseadas no diagnóstico (ex: ordem de aplicação, frequência, cuidados com o sol, hábitos diários)].
      - produtosRecomendados: [Array preenchido com os objetos dos produtos recomendados do catálogo].

      --- INSTRUÇÃO DE SAÍDA EM CASO DE ERRO (FOTOS REJEITADAS) ---
      Se as fotos forem INVÁLIDAS, você DEVE preencher o JSON exatamente assim:
      - analisePele: "FOTOS_INVALIDAS"
      - recomendacoesGerais: [Escreva aqui uma mensagem médica, humana e educada explicando o motivo exato da rejeição com base no requisito que falhou e o que fazer para corrigir].
      - produtosRecomendados: [] (Array vazio)
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
      model: "gemini-3.1-flash-lite",
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
    return NextResponse.json({ error: "Estamos tendo uma alta demanda, aguarde 1 minuto e tente novamente" }, { status: 500 });
  }
}
"use client";

import { useState, ChangeEvent, useRef } from "react";

interface Produto {
  id: string;
  nome: string;
  motivoUso: string;
}

interface ResultadoAnalise {
  analisePele: string;
  recomendacoesGerais: string;
  produtosRecomendados: Produto[];
}

export default function TesteIA() {
  // Referência para o scroll automático
  const resultadoRef = useRef<HTMLDivElement>(null);

  // Estados Expandidos para o Quiz Detalhado
  const [alimentacao, setAlimentacao] = useState("balanceada e saudável");
  const [tipoPele, setTipoPele] = useState("oleosa com tendência a acne");
  const [rotinaSkincare, setRotinaSkincare] = useState("nenhuma");
  const [sensibilidade, setSensibilidade] = useState("normal");
  const [objetivoPrincipal, setObjetivoPrincipal] = useState("controlar oleosidade/acne");
  
  // Estados para as Imagens e Resposta
  const [imagensBase64, setImagensBase64] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);

  // Função para converter os arquivos de imagem capturados para Base64
  const handleMudancaImagem = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const arquivos = Array.from(e.target.files);
    
    const promessasConversao = arquivos.map((arquivo) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(arquivo);
      });
    });

    const resultadosBase64 = await Promise.all(promessasConversao);
    
    setImagensBase64((prev) => [...prev, ...resultadosBase64]);
    e.target.value = "";
  };

  // Função para remover uma imagem específica da lista de preview
  const removerImagem = (indexParaRemover: number) => {
    setImagensBase64((prev) => prev.filter((_, index) => index !== indexParaRemover));
  };

  // Função que dispara os dados contra o nosso Backend
  const enviarParaAnalise = async () => {
    if (imagensBase64.length === 0) {
      alert("Por favor, selecione pelo menos uma foto da pele para testar.");
      return;
    }

    setCarregando(true);
    setResultado(null);

    try {
      const response = await fetch("/api/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respostasQuiz: { 
            alimentacao, 
            tipoPele, 
            rotinaSkincare, 
            sensibilidade, 
            objetivoPrincipal 
          },
          imagensBase64: imagensBase64,
        }),
      });

      const dados = await response.json();
      
      if (response.ok) {
        setResultado(dados);
        
        // Timeout garante que o DOM terminou de renderizar os novos elementos antes do scroll rodar
        setTimeout(() => {
          resultadoRef.current?.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }, 100);

      } else {
        alert("Erro na análise: " + (dados.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o backend.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
        <h1 className="text-2xl font-bold text-center text-teal-400">Teste de Conexão: Gemini Estética</h1>

        {/* Formulário do Quiz Simulado e Detalhado */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-teal-300">1. Questionário {/*Anamnese*/} (Quiz Detalhado)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Como está sua alimentação?</label>
              <select 
                value={alimentacao} 
                onChange={(e) => setAlimentacao(e.target.value)}
                className="bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:border-teal-500 text-sm"
              >
                <option value="balanceada e saudável">Balanceada (Frutas, legumes, muita água)</option>
                <option value="rica em açúcar e gordura">Rica em açúcares, frituras ou ultraprocessados</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Como você sente sua pele no dia a dia?</label>
              <select 
                value={tipoPele} 
                onChange={(e) => setTipoPele(e.target.value)}
                className="bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:border-teal-500 text-sm"
              >
                <option value="oleosa com tendência a acne">Oleosa (Brilho excessivo e espinhas)</option>
                <option value="seca e descamando">Seca (Repuxando ou descamando)</option>
                <option value="mista">Mista (Oleosa na zona T, seca nas bochechas)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Qual a sua rotina atual de Skincare?</label>
              <select 
                value={rotinaSkincare} 
                onChange={(e) => setRotinaSkincare(e.target.value)}
                className="bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:border-teal-500 text-sm"
              >
                <option value="nenhuma">Nenhuma (Só lavo com água ou sabonete comum)</option>
                <option value="básica">Básica (Apenas sabonete facial e protetor solar)</option>
                <option value="completa">Completa (Sabonete, hidratante, ácidos ou séruns)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Sua pele costuma ficar vermelha ou arder?</label>
              <select 
                value={sensibilidade} 
                onChange={(e) => setSensibilidade(e.target.value)}
                className="bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:border-teal-500 text-sm"
              >
                <option value="normal">Normal (Raramente reage mal a produtos)</option>
                <option value="sensível">Sensível (Fica vermelha ou arde com facilidade)</option>
                <option value="reativa a ácidos">Reativa (Reage muito a produtos fortes e ácidos)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Qual o seu objetivo principal ao tratar a pele?</label>
            <select 
              value={objetivoPrincipal} 
              onChange={(e) => setObjetivoPrincipal(e.target.value)}
              className="w-full bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:border-teal-500 text-sm"
            >
              <option value="controlar oleosidade e diminuir acne">Controlar oleosidade e reduzir espinhas/cravos</option>
              <option value="hidratar profundamente e acabar com o ressecamento">Hidratar profundamente e tratar descamação</option>
              <option value="suavizar manchas, melasma ou lines de expressão">Suavizar manchas, linhas de expressão e uniformizar o tom</option>
            </select>
          </div>
        </div>

        {/* Upload e Preview de Imagens */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-teal-300">2. Fotos da Pele {/*(Multimodal)*/}</h2>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleMudancaImagem}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
          />
          <p className="text-xs text-slate-400">Você pode selecionar várias fotos sequencialmente ou segurando o Ctrl.</p>

          {/* Grid de Miniaturas Selecionadas */}
          {imagensBase64.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2">
              {imagensBase64.map((imgSrc, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-600 bg-slate-900 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imgSrc} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  {/* Botão de Remover */}
                  <button
                    onClick={() => removerImagem(index)}
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md transition-transform hover:scale-110 focus:outline-none"
                    title="Remover imagem"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Envio */}
        <button
          onClick={enviarParaAnalise}
          disabled={carregando}
          className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-slate-900 font-bold py-3 px-4 rounded-md transition disabled:opacity-50"
        >
          {carregando ? "Enviando e Analisando com o Gemini..." : `🚀 Disparar Análise Completa (${imagensBase64.length} foto${imagensBase64.length !== 1 ? 's' : ''})`}
        </button>

        {/* Elemento de Âncora para Scroll e Renderização do Resultado */}
        <div ref={resultadoRef} className="scroll-mt-6">
          {resultado && (
            <div className="mt-8 space-y-6 border-t border-slate-700 pt-6 animate-fade-in">
              <h2 className="text-xl font-bold text-teal-400">📊 Resposta Estruturada da IA:</h2>
              
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-teal-300 mb-1">Análise Clínico-Visual:</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{resultado.analisePele}</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-teal-300 mb-1">Recomendações Gerais:</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{resultado.recomendacoesGerais}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-teal-300">🛍️ Cards de Produtos Recomendados {/*(Gerados via Array)*/}:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resultado.produtosRecomendados.map((produto) => (
                    <div key={produto.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-mono text-teal-400 block mb-1">{produto.id}</span>
                        <h4 className="font-bold text-slate-100 text-base">{produto.nome}</h4>
                        <p className="text-xs text-slate-300 mt-2 italic">"{produto.motivoUso}"</p>
                      </div>
                      <button className="mt-4 w-full bg-slate-900 hover:bg-slate-950 text-teal-400 border border-teal-500/30 text-xs py-2 rounded font-semibold transition">
                        Ver no Estoque
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
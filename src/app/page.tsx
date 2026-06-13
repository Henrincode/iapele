"use client";

import { useState, ChangeEvent, useRef } from "react";
// Importação da biblioteca de compressão
import imageCompression from "browser-image-compression";

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

  // --- CONFIGURAÇÕES DE MANUTENÇÃO ---
  const [limiteImagens] = useState(4);

  // Estados do Quiz (Baseados nos cards interativos)
  const [alimentacao, setAlimentacao] = useState("balanceada e saudável");
  const [tipoPele, setTipoPele] = useState("oleosa com tendência a acne");
  const [rotinaSkincare, setRotinaSkincare] = useState("nenhuma");
  const [sensibilidade, setSensibilidade] = useState("normal");
  const [objetivoPrincipal, setObjetivoPrincipal] = useState("controlar oleosidade e diminuir acne");
  
  // Estados para as Imagens e Resposta
  const [imagensBase64, setImagensBase64] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);

  // Função para converter e comprimir os arquivos de imagem capturados para WebP e Base64
  const handleMudancaImagem = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const arquivos = Array.from(e.target.files);

    if (imagensBase64.length + arquivos.length > limiteImagens) {
      alert(`Limite atingido! Você pode selecionar no máximo ${limiteImagens} fotos para análise.`);
      e.target.value = "";
      return;
    }

    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      fileType: "image/webp",
    };

    setCarregando(true);

    try {
      const promessasConversao = arquivos.map(async (arquivo) => {
        const compressedBlob = await imageCompression(arquivo, options);
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      });

      const resultadosBase64 = await Promise.all(promessasConversao);
      setImagensBase64((prev) => [...prev, ...resultadosBase64]);
    } catch (error) {
      console.error("Erro na compressão das imagens:", error);
      alert("Erro ao processar e otimizar as imagens selecionadas.");
    } finally {
      setCarregando(false);
      e.target.value = "";
    }
  };

  const removerImagem = (indexParaRemover: number) => {
    setImagensBase64((prev) => prev.filter((_, index) => index !== indexParaRemover));
  };

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
    <main className="min-h-screen bg-[#090f1c] text-slate-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-10 bg-[#0f172a]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
        
        <header className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-linear-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Análise Avançada de Pele
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Responda o questionário clínico e envie fotos nítidas para receber uma rotina personalizada de estética.
          </p>
        </header>

        {/* --- SEÇÃO 1: HÁBITOS DE VIDA --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-teal-400 font-bold">🌱 1.</span>
            <h2 className="text-base font-bold tracking-wider text-teal-400 uppercase">Hábitos de Vida</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD: ALIMENTAÇÃO */}
            <div className="bg-[#131c31] p-5 rounded-xl border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Alimentação</h3>
                  <p className="text-xs text-slate-400">Como você considera suas refeições diárias?</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setAlimentacao("balanceada e saudável")}
                  className={`text-left p-3 rounded-lg text-xs font-medium border transition-all ${alimentacao === "balanceada e saudável" ? "bg-teal-500/10 border-teal-500 text-teal-300 shadow-md" : "bg-[#182542] border-slate-700/60 text-slate-300 hover:border-slate-600"}`}
                >
                  🥗 Balanceada (Frutas, vegetais e água)
                </button>
                <button
                  type="button"
                  onClick={() => setAlimentacao("rica em açúcar e gordura")}
                  className={`text-left p-3 rounded-lg text-xs font-medium border transition-all ${alimentacao === "rica em açúcar e gordura" ? "bg-teal-500/10 border-teal-500 text-teal-300 shadow-md" : "bg-[#182542] border-slate-700/60 text-slate-300 hover:border-slate-600"}`}
                >
                  🍔 Rica em açúcares, frituras ou processados
                </button>
              </div>
            </div>

            {/* CARD: TIPO DE PELE */}
            <div className="bg-[#131c31] p-5 rounded-xl border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Sensação Diária da Pele</h3>
                  <p className="text-xs text-slate-400">Como você sente o rosto ao longo do dia?</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoPele("oleosa com tendência a acne")}
                  className={`text-left p-2.5 rounded-lg text-xs font-medium border transition-all ${tipoPele === "oleosa com tendência a acne" ? "bg-teal-500/10 border-teal-500 text-teal-300 shadow-md" : "bg-[#182542] border-slate-700/60 text-slate-300 hover:border-slate-600"}`}
                >
                  ✨ Oleosa (Brilho excessivo e espinhas)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPele("seca e descamando")}
                  className={`text-left p-2.5 rounded-lg text-xs font-medium border transition-all ${tipoPele === "seca e descamando" ? "bg-teal-500/10 border-teal-500 text-teal-300 shadow-md" : "bg-[#182542] border-slate-700/60 text-slate-300 hover:border-slate-600"}`}
                >
                  🍂 Seca (Repuxando ou descamando)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPele("mista")}
                  className={`text-left p-2.5 rounded-lg text-xs font-medium border transition-all ${tipoPele === "mista" ? "bg-teal-500/10 border-teal-500 text-teal-300 shadow-md" : "bg-[#182542] border-slate-700/60 text-slate-300 hover:border-slate-600"}`}
                >
                  🎭 Mista (Zona T oleosa, bochechas secas)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- SEÇÃO 2: CUIDADOS COM A PELE --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-teal-400 font-bold">🧴 2.</span>
            <h2 className="text-base font-bold tracking-wider text-teal-400 uppercase">Cuidados com a Pele</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD: ROTINA SKINCARE */}
            <div className="bg-[#131c31] p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Rotina Atual</div>
              <div className="flex flex-col gap-2">
                {["nenhuma", "básica", "completa"].map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setRotinaSkincare(nivel)}
                    className={`text-left p-2.5 rounded-lg text-xs capitalize border transition-all ${rotinaSkincare === nivel ? "bg-teal-500/10 border-teal-500 text-teal-300 font-medium" : "bg-[#182542] border-slate-700/60 text-slate-400 hover:border-slate-600"}`}
                  >
                    {nivel === "nenhuma" && "❌ Nenhuma (Apenas água)"}
                    {nivel === "básica" && "🧼 Básica (Sabonete + Filtro)"}
                    {nivel === "completa" && "🧪 Completa (Ácidos e Séruns)"}
                  </button>
                ))}
              </div>
            </div>

            {/* CARD: SENSIBILIDADE */}
            <div className="bg-[#131c31] p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Sensibilidade</div>
              <div className="flex flex-col gap-2">
                {["normal", "sensível", "reativa a ácidos"].map((sens) => (
                  <button
                    key={sens}
                    type="button"
                    onClick={() => setSensibilidade(sens)}
                    className={`text-left p-2.5 rounded-lg text-xs capitalize border transition-all ${sensibilidade === sens ? "bg-teal-500/10 border-teal-500 text-teal-300 font-medium" : "bg-[#182542] border-slate-700/60 text-slate-400 hover:border-slate-600"}`}
                  >
                    {sens === "normal" && "🛡️ Normal (Raras reações)"}
                    {sens === "sensível" && "🔥 Sensível (Arde com facilidade)"}
                    {sens === "reativa a ácidos" && "⚠️ Reativa (Muito sensível a ácidos)"}
                  </button>
                ))}
              </div>
            </div>

            {/* CARD: OBJETIVO PRINCIPAL */}
            <div className="bg-[#131c31] p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="text-teal-400 font-semibold text-xs uppercase tracking-wider">Objetivo Foco</div>
              <div className="flex flex-col gap-2">
                {[
                  "controlar oleosidade e diminuir acne",
                  "hidratar profundamente e acabar com o ressecamento",
                  "suavizar manchas, melasma ou lines de expressão"
                ].map((obj) => (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => setObjetivoPrincipal(obj)}
                    className={`text-left p-2.5 rounded-lg text-[11px] border transition-all leading-tight ${objetivoPrincipal === obj ? "bg-teal-500/10 border-teal-500 text-teal-300 font-medium" : "bg-[#182542] border-slate-700/60 text-slate-400 hover:border-slate-600"}`}
                  >
                    {obj.includes("oleosidade") && "🎯 Controlar Acne/Oleosidade"}
                    {obj.includes("hidratar") && "💧 Hidratação Profunda"}
                    {obj.includes("manchas") && "✨ Suavizar Manchas/Linhas"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- SEÇÃO 3: FOTOS DA PELE (MULTIMODAL) --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-teal-400 font-bold">📸 3.</span>
              <h2 className="text-base font-bold tracking-wider text-teal-400 uppercase">Fotos da Pele (Multimodal)</h2>
            </div>
            <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700 font-mono">
              {imagensBase64.length} / {limiteImagens} arquivados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {imagensBase64.map((imgSrc, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group animate-fade-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imgSrc} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  onClick={() => removerImagem(index)}
                  type="button"
                  disabled={carregando}
                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg transition"
                >
                  ✕
                </button>
              </div>
            ))}

            {imagensBase64.length < limiteImagens && (
              <div className="aspect-square">
                <input 
                  type="file" 
                  id="file-upload"
                  accept="image/*" 
                  multiple 
                  onChange={handleMudancaImagem}
                  disabled={carregando}
                  className="sr-only"
                />
                <label 
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center h-full w-full rounded-xl border-2 border-dashed border-slate-700 bg-[#131c31]/40 hover:border-teal-500/50 hover:bg-[#131c31]/80 cursor-pointer transition-all ${carregando ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-8 h-8 text-slate-500 mb-1.5 font-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                  <span className="text-xs text-slate-400 font-semibold text-center px-2">
                    {carregando ? "Otimizando..." : "Enviar fotos"}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Envio */}
        <button
          onClick={enviarParaAnalise}
          disabled={carregando || imagensBase64.length === 0}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-extrabold py-4 px-4 rounded-xl transition duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {carregando 
            ? "Processando e Analisando com o Gemini..." 
            : `Enviar e Analisar com o Gemini (${imagensBase64.length} foto${imagensBase64.length !== 1 ? 's' : ''})`}
        </button>

        {/* Renderização do Resultado */}
        <div ref={resultadoRef} className="scroll-mt-6">
          {resultado && (
            <div className="mt-10 space-y-6 border-t border-slate-800 pt-8 animate-fade-in">
              <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2">
                <span>📊</span> Resposta Estruturada da IA:
              </h2>
              
              <div className="bg-[#131c31] p-5 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-teal-300 mb-2 text-sm">Análise Clínico-Visual:</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{resultado.analisePele}</p>
              </div>

              <div className="bg-[#131c31] p-5 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-teal-300 mb-2 text-sm">Recomendações Gerais:</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{resultado.recomendacoesGerais}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-teal-300 text-sm">🛍️ Cards de Produtos Recomendados:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resultado.produtosRecomendados.map((produto) => (
                    <div key={produto.id} className="bg-[#182542]/50 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition">
                      <div>
                        <span className="text-[10px] font-mono bg-slate-800 text-teal-400 px-2 py-0.5 rounded-md border border-slate-700 inline-block mb-2">{produto.id}</span>
                        <h4 className="font-bold text-slate-100 text-base">{produto.nome}</h4>
                        <p className="text-xs text-slate-300 mt-2 italic border-l-2 border-teal-500/40 pl-2">"{produto.motivoUso}"</p>
                      </div>
                      <button className="mt-5 w-full bg-[#0f172a] hover:bg-[#090f1c] text-teal-400 border border-teal-500/20 hover:border-teal-500/40 text-xs py-2.5 rounded-lg font-semibold transition">
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
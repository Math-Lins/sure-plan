"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Landmark, Sparkles, Info } from "lucide-react";
import { CasaAposta } from "@/lib/apostas";

function formatarNumero(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarMoeda(valor: number) {
  if (!isFinite(valor)) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function NovaAposta() {
  const router = useRouter();
  const [casas, setCasas] = useState<CasaAposta[]>([
    { nome: "", odd: 0, investimento: 0, status: "pendente" },
  ]);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [mercado, setMercado] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizarCasa(index: number, valor: string) {
    const novasCasas = [...casas];
    novasCasas[index].nome = valor;
    setCasas(novasCasas);
  }

  function atualizarCampoNumerico(index: number, campo: "odd" | "investimento", valorDigitado: string) {
    const somenteDigitos = valorDigitado.replace(/\D/g, "");
    const valorFinal = Number(somenteDigitos) / 100;
    const novasCasas = [...casas];
    novasCasas[index][campo] = valorFinal;
    setCasas(novasCasas);
  }

  function adicionarCasa() {
    setCasas([...casas, { nome: "", odd: 0, investimento: 0, status: "pendente" }]);
  }

  function removerCasa(index: number) {
    setCasas(casas.filter((_, i) => i !== index));
  }

  async function handleSalvar() {
    if (!data || casas.some((c) => !c.nome || !c.odd || !c.investimento)) {
      alert("Preencha todos os campos obrigatórios das casas e a data.");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/apostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, horario, mercado, observacao, casas }),
      });
      if (!res.ok) throw new Error();
      router.push("/planilha");
    } catch {
      alert("Erro ao salvar aposta. Tente novamente.");
      setSalvando(false);
    }
  }

  const investimentoTotal = casas.reduce((s, c) => s + c.investimento, 0);
  const retornos = casas.filter((c) => c.odd > 0 && c.investimento > 0).map((c) => c.odd * c.investimento);
  const menorRetorno = retornos.length > 0 ? Math.min(...retornos) : 0;
  const maiorRetorno = retornos.length > 0 ? Math.max(...retornos) : 0;
  const lucroMinimo = menorRetorno - investimentoTotal;
  const lucroMaximo = maiorRetorno - investimentoTotal;
  const roiMinimo = investimentoTotal > 0 ? (lucroMinimo / investimentoTotal) * 100 : 0;
  const casasPreenchidas = casas.filter((c) => c.nome && c.odd > 0 && c.investimento > 0).length;

  return (
    <div className="max-w-6xl mx-auto relative">
      <div className="absolute -top-10 -left-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <PlusCircle size={26} className="text-amber-400" />
          Nova <span className="glow-text">Aposta</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Registre as casas, odds e valores da sua entrada surebet.</p>
      </div>

      <div className="relative grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-4">
          {casas.map((casa, index) => (
            <div key={index} className="glow-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Landmark size={16} className="text-amber-400" />
                  Casa {index + 1}
                </h2>
                {casas.length > 1 && (
                  <button onClick={() => removerCasa(index)} className="text-red-400 text-sm hover:underline">
                    Remover
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Nome da Casa</label>
                  <input
                    type="text"
                    value={casa.nome}
                    onChange={(e) => atualizarCasa(index, e.target.value)}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Odd</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={casa.odd ? formatarNumero(casa.odd) : ""}
                    onChange={(e) => atualizarCampoNumerico(index, "odd", e.target.value)}
                    placeholder="0,00"
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Investimento (R$)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={casa.investimento ? formatarNumero(casa.investimento) : ""}
                    onChange={(e) => atualizarCampoNumerico(index, "investimento", e.target.value)}
                    placeholder="0,00"
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors"
                  />
                </div>
              </div>
              {casa.odd > 0 && casa.investimento > 0 && (
                <p className="text-xs text-gray-500 mt-3">
                  Se essa casa ganhar, retorno de{" "}
                  <span className="text-emerald-400 font-medium">{formatarMoeda(casa.odd * casa.investimento)}</span>
                </p>
              )}
            </div>
          ))}

          <button onClick={adicionarCasa} className="text-amber-400 text-sm font-medium hover:underline self-start">
            + Adicionar outra casa
          </button>

          <div className="glow-card rounded-2xl p-6 grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400">Data do Evento</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Horário do Evento</label>
              <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Mercado (opcional)</label>
              <input type="text" placeholder="Ex: Handicap, Over..." value={mercado} onChange={(e) => setMercado(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
            <div className="col-span-3">
              <label className="text-sm text-gray-400">Observação (opcional)</label>
              <textarea placeholder="Motivo da entrada, análise, etc..." value={observacao} onChange={(e) => setObservacao(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
          </div>

          <button onClick={handleSalvar} disabled={salvando}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl py-3.5 self-end px-10 transition-all disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar Aposta"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`glow-card rounded-2xl p-6 ${lucroMinimo > 0 ? "glow-border" : ""}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-2 rounded-lg">
                <Sparkles size={18} className="text-amber-400" />
              </div>
              <h2 className="font-bold text-white">Prévia da Entrada</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-500">Investimento Total</p>
                <p className="text-xl font-bold text-white">{formatarMoeda(investimentoTotal)}</p>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <p className="text-xs text-gray-500">Pior cenário</p>
                <p className={`text-xl font-bold ${lucroMinimo > 0 ? "text-emerald-400" : lucroMinimo < 0 ? "text-red-400" : "text-white"}`}>
                  {formatarMoeda(lucroMinimo)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Melhor cenário</p>
                <p className={`text-xl font-bold ${lucroMaximo > 0 ? "text-emerald-400" : "text-white"}`}>
                  {formatarMoeda(lucroMaximo)}
                </p>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <p className="text-xs text-gray-500">ROI mínimo garantido</p>
                <p className={`text-lg font-bold ${roiMinimo > 0 ? "text-emerald-400" : roiMinimo < 0 ? "text-red-400" : "text-white"}`}>
                  {roiMinimo.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-purple-400" />
              <h2 className="font-bold text-white text-sm">Preenchimento</h2>
            </div>
            <p className="text-xs text-gray-500">{casasPreenchidas} de {casas.length} casas preenchidas completamente.</p>
            <div className="w-full bg-black/40 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all"
                style={{ width: `${(casasPreenchidas / casas.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, Target, X } from "lucide-react";
import {
  Aposta,
  StatusCasa,
  calcularRetorno,
  calcularRetornoCasa,
  calcularROI,
  statusGeralAposta,
} from "@/lib/apostas";
import { Ganho } from "@/lib/ganhos";
import { calcularResumoMes, mesAtualIso, somarMes, nomeMes } from "@/lib/relatorios";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const corStatus: Record<StatusCasa, string> = {
  pendente: "bg-gray-500/15 text-gray-300 border-gray-500/20",
  ganhou: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  perdeu: "bg-red-500/15 text-red-400 border-red-500/20",
  devolvida: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  cashout: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

type ApostaAPI = Aposta & { casas: (Aposta["casas"][0] & { id: string })[] };

export default function Planilha() {
  const [apostas, setApostas] = useState<ApostaAPI[]>([]);
  const [ganhos, setGanhos] = useState<Ganho[]>([]);
  const [meta, setMeta] = useState(10000);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualIso());
  const [loadingCasaId, setLoadingCasaId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Cashout modal state
  const [cashoutPendente, setCashoutPendente] = useState<{
    apostaId: string;
    casaId: string;
  } | null>(null);
  const [valorCashoutInput, setValorCashoutInput] = useState("");
  const [cashoutErro, setCashoutErro] = useState("");

  async function carregarDados() {
    try {
      const [resApostas, resGanhos, resMeta] = await Promise.all([
        fetch("/api/apostas"),
        fetch("/api/ganhos"),
        fetch("/api/meta"),
      ]);
      if (resApostas.ok) setApostas(await resApostas.json());
      if (resGanhos.ok) setGanhos(await resGanhos.json());
      if (resMeta.ok) {
        const { meta: m } = await resMeta.json();
        setMeta(m);
      }
    } catch {
      // silently ignore network errors on background reload
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function abrirCashout(apostaId: string, casaId: string) {
    setValorCashoutInput("");
    setCashoutErro("");
    setCashoutPendente({ apostaId, casaId });
  }

  async function confirmarCashout() {
    if (!cashoutPendente) return;
    const valor = Number(valorCashoutInput.replace(",", "."));
    if (!valorCashoutInput || isNaN(valor) || valor <= 0) {
      setCashoutErro("Informe um valor válido maior que zero.");
      return;
    }
    setCashoutPendente(null);
    await executarMudancaStatus(cashoutPendente.apostaId, cashoutPendente.casaId, "cashout", valor);
  }

  async function executarMudancaStatus(
    apostaId: string,
    casaId: string,
    status: StatusCasa,
    valorCashout?: number
  ) {
    setLoadingCasaId(casaId);
    try {
      const res = await fetch(`/api/apostas/${apostaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ casaId, status, valorCashout }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao atualizar status.");
      }
      await carregarDados();
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingCasaId(null);
    }
  }

  function mudarStatusCasa(apostaId: string, casaId: string, status: StatusCasa) {
    if (status === "cashout") {
      abrirCashout(apostaId, casaId);
    } else {
      executarMudancaStatus(apostaId, casaId, status);
    }
  }

  async function remover(id: string) {
    if (!confirm("Tem certeza que quer excluir essa aposta?")) return;
    try {
      const res = await fetch(`/api/apostas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Erro ao excluir aposta.");
        return;
      }
      await carregarDados();
    } catch {
      alert("Erro de conexão. Tente novamente.");
    }
  }

  const apostasDoMes = apostas.filter((a) => {
    if (!a.data.startsWith(mesSelecionado)) return false;
    if (filtroStatus === "todos") return true;
    return statusGeralAposta(a) === filtroStatus;
  });
  const apostasOrdenadas = [...apostasDoMes].sort((a, b) => {
    const aPendente = statusGeralAposta(a) === "pendente";
    const bPendente = statusGeralAposta(b) === "pendente";
    if (aPendente && !bPendente) return -1;
    if (!aPendente && bPendente) return 1;
    if (aPendente) return a.data.localeCompare(b.data);
    return b.data.localeCompare(a.data);
  });

  const totalApostas = apostasDoMes.length;
  const pendentes = apostasDoMes.filter((a) => statusGeralAposta(a) === "pendente").length;
  const investidoPendente = apostasDoMes
    .filter((a) => statusGeralAposta(a) === "pendente")
    .reduce((s, a) => s + a.casas.reduce((si, c) => si + c.investimento, 0), 0);

  const resumo = calcularResumoMes(apostas as Aposta[], ganhos, meta, mesSelecionado);

  return (
    <div>
      {/* Cashout Modal */}
      {cashoutPendente && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="glow-card glow-border rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white">Valor do Cashout</h2>
              <button onClick={() => setCashoutPendente(null)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <label className="text-sm text-gray-400">Valor recebido (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="Ex: 150,00"
              value={valorCashoutInput}
              onChange={(e) => {
                setValorCashoutInput(e.target.value.replace(/[^\d.,]/g, ""));
                setCashoutErro("");
              }}
              onKeyDown={(e) => e.key === "Enter" && confirmarCashout()}
              className="w-full mt-1 mb-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-lg font-bold focus:border-amber-500/50 outline-none transition-colors"
            />
            {cashoutErro && <p className="text-red-400 text-xs mb-3">{cashoutErro}</p>}
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setCashoutPendente(null)}
                className="flex-1 border border-white/10 text-gray-400 font-medium rounded-lg py-2.5 hover:border-white/20">
                Cancelar
              </button>
              <button
                onClick={confirmarCashout}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg py-2.5">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-white">
          Planilha de <span className="glow-text">Apostas</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5">
            <button onClick={() => setMesSelecionado(somarMes(mesSelecionado, -1))} className="text-gray-400 hover:text-white p-1">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-white px-2 min-w-[130px] text-center">
              {nomeMes(mesSelecionado)}
            </span>
            <button onClick={() => setMesSelecionado(somarMes(mesSelecionado, 1))} className="text-gray-400 hover:text-white p-1">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:border-amber-500/30">
            <Printer size={16} />
            Print do Mês
          </button>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["todos", "pendente", "finalizada"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtroStatus === f
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300"
            }`}
          >
            {f === "todos" ? "Todas" : f === "pendente" ? "Pendentes" : "Finalizadas"}
          </button>
        ))}
      </div>

      <div id="resumo-mes-print" className="glow-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-amber-400" />
          <h2 className="font-bold text-white">Resumo de {nomeMes(mesSelecionado)}</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Investido</p>
            <p className="text-xl font-bold text-white">{formatarMoeda(resumo.investido)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ROI</p>
            <p className={`text-xl font-bold ${resumo.roi > 0 ? "text-emerald-400" : resumo.roi < 0 ? "text-red-400" : "text-white"}`}>
              {resumo.roi.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Lucro</p>
            <p className={`text-xl font-bold ${resumo.lucro > 0 ? "text-emerald-400" : resumo.lucro < 0 ? "text-red-400" : "text-white"}`}>
              {formatarMoeda(resumo.lucro)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Meta ({formatarMoeda(resumo.meta)})</p>
            <p className={`text-xl font-bold ${resumo.metaBatida ? "text-emerald-400" : "text-red-400"}`}>
              {resumo.metaBatida ? "BATIDA ✓" : "NÃO BATIDA"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glow-card rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total de Apostas</p>
          <p className="text-2xl font-bold text-white">{totalApostas}</p>
        </div>
        <div className="glow-card rounded-2xl p-5">
          <p className="text-sm text-gray-400">Apostas Pendentes</p>
          <p className="text-2xl font-bold text-white">{pendentes}</p>
        </div>
        <div className="glow-card rounded-2xl p-5">
          <p className="text-sm text-gray-400">Valores Pendentes</p>
          <p className="text-2xl font-bold text-white">{formatarMoeda(investidoPendente)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {apostasOrdenadas.length === 0 && (
          <div className="glow-card rounded-2xl p-6 text-center text-gray-500">
            Nenhuma aposta em {nomeMes(mesSelecionado)}.
          </div>
        )}

        {apostasOrdenadas.map((aposta) => {
          const investimentoTotal = aposta.casas.reduce((s, c) => s + c.investimento, 0);
          const lucro = calcularRetorno(aposta);
          const roi = calcularROI(aposta);

          return (
            <div key={aposta.id} className="glow-card rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-gray-400 text-sm">
                    {aposta.data.split("-").reverse().join("/")}
                    {aposta.horario && ` às ${aposta.horario}`}
                    {aposta.mercado && ` · ${aposta.mercado}`}
                  </p>
                  <p className="text-sm">
                    Investimento total:{" "}
                    <span className="text-white font-medium">{formatarMoeda(investimentoTotal)}</span>
                    {" · "}Lucro:{" "}
                    <span className={`font-medium ${lucro === null ? "text-gray-400" : lucro > 0 ? "text-emerald-400" : lucro < 0 ? "text-red-400" : "text-gray-400"}`}>
                      {lucro === null ? "Pendente" : formatarMoeda(lucro)}
                    </span>
                    {" · "}ROI:{" "}
                    <span className={`font-medium ${roi === null ? "text-gray-400" : roi > 0 ? "text-emerald-400" : roi < 0 ? "text-red-400" : "text-gray-400"}`}>
                      {roi === null ? "-" : `${roi}%`}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/apostas/editar/${aposta.id}`}
                    className="bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-amber-500/20">
                    Editar
                  </Link>
                  <button onClick={() => remover(aposta.id)}
                    className="bg-red-500/10 text-red-400 border border-red-500/25 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-500/20">
                    Excluir
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {aposta.casas.map((casa) => {
                  const retornoCasa = calcularRetornoCasa(casa);
                  const isLoading = loadingCasaId === casa.id;
                  return (
                    <div key={casa.id}
                      className="flex items-center justify-between bg-black/25 rounded-xl px-4 py-2 border border-white/[0.04]">
                      <div className="text-white text-sm">
                        {casa.nome} <span className="text-gray-500">(odd {casa.odd})</span>{" "}
                        <span className="text-gray-500">— investiu {formatarMoeda(casa.investimento)}</span>
                        {casa.status !== "pendente" && (
                          <span className="text-amber-400"> · retorno {formatarMoeda(retornoCasa)}</span>
                        )}
                      </div>
                      <select
                        value={casa.status}
                        disabled={isLoading}
                        onChange={(e) => mudarStatusCasa(aposta.id, casa.id, e.target.value as StatusCasa)}
                        className={`rounded-lg px-2 py-1 text-xs font-bold border outline-none transition-opacity ${corStatus[casa.status]} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <option value="pendente">PENDENTE</option>
                        <option value="ganhou">GANHOU</option>
                        <option value="perdeu">PERDEU</option>
                        <option value="devolvida">DEVOLVIDA</option>
                        <option value="cashout">CASHOUT</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

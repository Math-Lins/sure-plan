"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Ganho, TipoGanho } from "@/lib/ganhos";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GanhosExtras() {
  const [ganhos, setGanhos] = useState<Ganho[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState<TipoGanho>("lucro");
  const [casa, setCasa] = useState("");
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [data, setData] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarGanhos() {
    try {
      const res = await fetch("/api/ganhos");
      if (res.ok) setGanhos(await res.json());
    } catch {
      // silently ignore on background reload
    }
  }

  useEffect(() => {
    carregarGanhos();
  }, []);

  async function handleSalvar() {
    if (!casa || !valor || !data) {
      alert("Preencha casa, valor e data.");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/ganhos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          tipo,
          casa,
          valor: Number(valor.replace(",", ".")),
          observacao,
        }),
      });
      if (!res.ok) throw new Error();
      await carregarGanhos();
      setMostrarForm(false);
      setTipo("lucro");
      setCasa("");
      setValor("");
      setObservacao("");
      setData("");
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Excluir esse lançamento?")) return;
    try {
      const res = await fetch(`/api/ganhos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Erro ao excluir lançamento.");
        return;
      }
      await carregarGanhos();
    } catch {
      alert("Erro de conexão. Tente novamente.");
    }
  }

  const totalLucros = ganhos.filter((g) => g.tipo === "lucro").reduce((s, g) => s + g.valor, 0);
  const totalPerdas = ganhos.filter((g) => g.tipo === "perda").reduce((s, g) => s + g.valor, 0);
  const lucroLiquido = totalLucros - totalPerdas;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Ganhos <span className="glow-text">Extras</span>
          </h1>
          <p className="text-sm text-gray-500">Organize seus ganhos, perdas e prêmios.</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all">
          <Plus size={16} />
          Adicionar Ganho
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glow-card rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total de Lucros</p>
          <p className="text-2xl font-bold text-emerald-400">{formatarMoeda(totalLucros)}</p>
        </div>
        <div className="glow-card rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total de Perdas</p>
          <p className="text-2xl font-bold text-red-400">{formatarMoeda(totalPerdas)}</p>
        </div>
        <div className="glow-card rounded-2xl p-5 glow-border">
          <p className="text-sm text-gray-400">Lucro Líquido</p>
          <p className="text-2xl font-bold text-white">{formatarMoeda(lucroLiquido)}</p>
        </div>
      </div>

      {mostrarForm && (
        <div className="glow-card rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoGanho)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="lucro">Lucro</option>
                <option value="perda">Perda</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Casa</label>
              <input type="text" value={casa} onChange={(e) => setCasa(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Valor (R$)</label>
              <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00"
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-400">Observação (opcional)</label>
              <input type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Missão, cashback..."
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
            </div>
          </div>
          <button onClick={handleSalvar} disabled={salvando}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg px-6 py-2 text-sm transition-all disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      )}

      <div className="glow-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-white/10">
              <th className="p-4">Data</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Casa</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Observação</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ganhos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">Nenhum lançamento ainda.</td>
              </tr>
            )}
            {ganhos.map((g) => (
              <tr key={g.id} className="border-b border-white/5">
                <td className="p-4 text-gray-300">{g.data.split("-").reverse().join("/")}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${g.tipo === "lucro" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"}`}>
                    {g.tipo === "lucro" ? "LUCRO" : "PERDA"}
                  </span>
                </td>
                <td className="p-4 text-white">{g.casa}</td>
                <td className={`p-4 font-medium ${g.tipo === "lucro" ? "text-emerald-400" : "text-red-400"}`}>
                  {g.tipo === "lucro" ? "+" : "-"} {formatarMoeda(g.valor)}
                </td>
                <td className="p-4 text-gray-400">{g.observacao}</td>
                <td className="p-4">
                  <button onClick={() => remover(g.id)} className="text-red-400 hover:underline text-xs">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

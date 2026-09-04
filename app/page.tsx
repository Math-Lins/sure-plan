"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, DollarSign, Calendar, Wallet, Target, Zap, X } from "lucide-react";
import { calcularRetorno, statusGeralAposta, Aposta } from "@/lib/apostas";
import { Ganho } from "@/lib/ganhos";
import { calcularResumoMes, mesAtualIso, nomeMes } from "@/lib/relatorios";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Card({ icon: Icon, label, sublabel, value, destaque = false }: {
  icon: any; label: string; sublabel?: string; value: string; destaque?: boolean;
}) {
  return (
    <div className={`glow-card rounded-2xl p-5 flex-1 min-w-[180px] ${destaque ? "glow-border" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-400 p-2 rounded-lg">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          {sublabel && <p className="text-xs text-gray-600">{sublabel}</p>}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ultimosDias(qtd: number) {
  const dias = [];
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    dias.push({ iso, label });
  }
  return dias;
}

function inicioSemanaAtualIso() {
  const d = new Date();
  const diaSemana = d.getDay();
  const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const segunda = new Date(d);
  segunda.setDate(d.getDate() - diffParaSegunda);
  segunda.setHours(0, 0, 0, 0);
  return segunda.toISOString().split("T")[0];
}

function diasDaSemanaAtual() {
  const inicioIso = inicioSemanaAtualIso();
  const [ano, mes, dia] = inicioIso.split("-").map(Number);
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ano, mes - 1, dia + i);
    dias.push(d.toISOString().split("T")[0]);
  }
  return dias;
}

const META_PADRAO = 10000;

export default function Dashboard() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [ganhos, setGanhos] = useState<Ganho[]>([]);
  const [meta, setMeta] = useState(META_PADRAO);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/apostas"), fetch("/api/ganhos"), fetch("/api/meta")])
      .then(async ([resA, resG, resM]) => {
        if (resA.ok) setApostas(await resA.json());
        if (resG.ok) setGanhos(await resG.json());
        if (resM.ok) {
          const { meta: m } = await resM.json();
          setMeta(m);
        }
      })
      .catch(() => {});
  }, []);

  function abrirEdicaoMeta() {
    setNovaMeta(String(meta));
    setEditandoMeta(true);
  }

  async function salvarMeta() {
    const valor = Number(novaMeta.replace(",", "."));
    if (valor > 0) {
      setMeta(valor);
      try {
        await fetch("/api/meta", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meta: valor }),
        });
      } catch {
        // silently ignore — UI already updated
      }
    }
    setEditandoMeta(false);
  }

  const finalizadas = apostas.filter((a) => statusGeralAposta(a) === "finalizada");
  const investidoTotal = apostas.reduce((s, a) => s + a.casas.reduce((si, c) => si + c.investimento, 0), 0);
  const lucroApostas = finalizadas.reduce((s, a) => s + (calcularRetorno(a) ?? 0), 0);
  const lucroGanhos = ganhos.reduce((s, g) => s + (g.tipo === "lucro" ? g.valor : -g.valor), 0);
  const lucroTotal = lucroApostas + lucroGanhos;
  const roi = investidoTotal > 0 ? (lucroApostas / investidoTotal) * 100 : 0;

  function lucroDoDia(iso: string) {
    const daApostas = finalizadas.filter((a) => a.data === iso).reduce((s, a) => s + (calcularRetorno(a) ?? 0), 0);
    const dosGanhos = ganhos.filter((g) => g.data === iso).reduce((s, g) => s + (g.tipo === "lucro" ? g.valor : -g.valor), 0);
    return daApostas + dosGanhos;
  }

  const diasSemanaAtual = diasDaSemanaAtual();
  const lucroSemana = diasSemanaAtual.reduce((s, iso) => s + lucroDoDia(iso), 0);
  const seteDias = ultimosDias(7);
  const dadosGrafico = seteDias.map(({ iso, label }) => ({ dia: label, valor: lucroDoDia(iso) }));

  const mesAtual = mesAtualIso();
  const resumoMes = calcularResumoMes(apostas, ganhos, meta, mesAtual);

  const diasDoMes = Array.from(new Set([
    ...finalizadas.filter((a) => a.data.startsWith(mesAtual)).map((a) => a.data),
    ...ganhos.filter((g) => g.data.startsWith(mesAtual)).map((g) => g.data),
  ]));
  let melhorDia = { data: "-", valor: 0 };
  diasDoMes.forEach((dia) => {
    const valor = lucroDoDia(dia);
    if (valor > melhorDia.valor) melhorDia = { data: dia, valor };
  });

  const apostasDoMes = apostas.filter((a) => a.data.startsWith(mesAtual)).length;
  const progresso = meta > 0 ? Math.min((resumoMes.lucro / meta) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {editandoMeta && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="glow-card glow-border rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white">Editar Meta Fixa</h2>
              <button onClick={() => setEditandoMeta(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <label className="text-sm text-gray-400">Meta (R$)</label>
            <input type="text" inputMode="numeric" autoFocus value={novaMeta}
              onChange={(e) => setNovaMeta(e.target.value.replace(/[^\d.,]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && salvarMeta()}
              className="w-full mt-1 mb-4 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-lg font-bold focus:border-amber-500/50 outline-none transition-colors" />
            <button onClick={salvarMeta} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg py-2.5">
              Salvar Meta
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-4">
        <Card icon={TrendingUp} label="ROI" value={`${roi.toFixed(2)}%`} />
        <Card icon={DollarSign} label="Total Investido" value={formatarMoeda(investidoTotal)} />
        <Card icon={Calendar} label="Lucro da Semana" value={formatarMoeda(lucroSemana)} />
        <Card icon={Wallet} label="Lucro Total" sublabel="Planilha + Extras" value={formatarMoeda(lucroTotal)} destaque />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glow-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            Desempenho Financeiro
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dadosGrafico}>
              <defs>
                <linearGradient id="corGrafico" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1a24" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" stroke="#555" fontSize={12} />
              <YAxis stroke="#555" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#12121c", border: "1px solid #2a2a3a", borderRadius: 10 }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: any) => formatarMoeda(Number(value))}
              />
              <Area type="monotone" dataKey="valor" stroke="#f59e0b" strokeWidth={2.5} fill="url(#corGrafico)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glow-card rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              Desempenho de {nomeMes(mesAtual)}
            </h2>
            <button onClick={abrirEdicaoMeta} className="text-xs text-amber-400 hover:underline">editar meta</button>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Reinicia automaticamente no início de cada mês.</p>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Progresso da Meta</span>
              <span className="text-amber-400 font-bold">{progresso.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-purple-500" style={{ width: `${progresso}%` }} />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Atual (mês)</span>
            <span className="text-white font-medium">{formatarMoeda(resumoMes.lucro)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Meta Fixa</span>
            <span className="text-white font-medium">{formatarMoeda(meta)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              Melhor Dia {melhorDia.data !== "-" && `(${melhorDia.data.split("-").reverse().join("/")})`}
            </span>
            <span className="text-amber-400 font-medium">{formatarMoeda(melhorDia.valor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Apostas no Mês</span>
            <span className="text-white font-medium">{apostasDoMes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

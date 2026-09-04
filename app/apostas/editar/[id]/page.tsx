"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CasaAposta } from "@/lib/apostas";

function formatarNumero(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EditarAposta() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [casas, setCasas] = useState<CasaAposta[]>([]);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [mercado, setMercado] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    fetch(`/api/apostas/${id}`)
      .then((r) => r.json())
      .then((aposta) => {
        setCasas(aposta.casas.map((c: any) => ({
          nome: c.nome,
          odd: c.odd,
          investimento: c.investimento,
          status: c.status,
          valorCashout: c.valorCashout ?? undefined,
        })));
        setData(aposta.data);
        setHorario(aposta.horario || "");
        setMercado(aposta.mercado || "");
        setObservacao(aposta.observacao || "");
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, [id]);

  function atualizarNome(index: number, valor: string) {
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
      const res = await fetch(`/api/apostas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, horario, mercado, observacao, casas }),
      });
      if (!res.ok) throw new Error();
      router.push("/planilha");
    } catch {
      alert("Erro ao salvar. Tente novamente.");
      setSalvando(false);
    }
  }

  if (carregando) return <p className="text-gray-400">Carregando...</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">
        Editar <span className="glow-text">Aposta</span>
      </h1>

      <div className="flex flex-col gap-4">
        {casas.map((casa, index) => (
          <div key={index} className="glow-card rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-500" />
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
                <input type="text" value={casa.nome} onChange={(e) => atualizarNome(index, e.target.value)}
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Odd</label>
                <input type="text" inputMode="numeric" value={casa.odd ? formatarNumero(casa.odd) : ""}
                  onChange={(e) => atualizarCampoNumerico(index, "odd", e.target.value)} placeholder="0,00"
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Investimento (R$)</label>
                <input type="text" inputMode="numeric" value={casa.investimento ? formatarNumero(casa.investimento) : ""}
                  onChange={(e) => atualizarCampoNumerico(index, "investimento", e.target.value)} placeholder="0,00"
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
              </div>
            </div>
          </div>
        ))}

        <button onClick={adicionarCasa} className="text-amber-400 text-sm font-medium hover:underline self-start">
          + Adicionar outra casa
        </button>

        <div className="glow-card rounded-2xl p-5 grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400">Data do Evento</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Horário do Evento</label>
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)}
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Mercado (opcional)</label>
            <input type="text" placeholder="Ex: Handicap, Over..." value={mercado} onChange={(e) => setMercado(e.target.value)}
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
          </div>
          <div className="col-span-3">
            <label className="text-sm text-gray-400">Observação (opcional)</label>
            <textarea placeholder="Motivo da entrada, análise, etc..." value={observacao} onChange={(e) => setObservacao(e.target.value)}
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500/50 outline-none transition-colors" />
          </div>
        </div>

        <button onClick={handleSalvar} disabled={salvando}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg py-3 self-end px-8 transition-all disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}

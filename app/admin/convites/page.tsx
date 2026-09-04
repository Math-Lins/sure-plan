"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Trash2, Check } from "lucide-react";

interface Convite {
  id: string;
  token: string;
  usado: boolean;
  criadoEm: string;
}

export default function AdminConvites() {
  const [convites, setConvites] = useState<Convite[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    carregarConvites();
  }, []);

  async function carregarConvites() {
    try {
      const res = await fetch("/api/convites");
      if (res.ok) setConvites(await res.json());
    } catch {
      // silently ignore
    } finally {
      setCarregando(false);
    }
  }

  async function handleGerar() {
    setGerando(true);
    try {
      const res = await fetch("/api/convites", { method: "POST" });
      if (res.ok) await carregarConvites();
      else alert("Erro ao gerar convite.");
    } catch {
      alert("Erro de conexão.");
    } finally {
      setGerando(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Excluir esse convite?")) return;
    try {
      const res = await fetch(`/api/convites/${id}`, { method: "DELETE" });
      if (res.ok) await carregarConvites();
      else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro ${res.status}: ${err.error || "Erro ao excluir convite."}`);
      }
    } catch {
      alert("Erro de conexão.");
    }
  }

  function copiarLink(convite: Convite) {
    const link = `${baseUrl}/cadastro?convite=${convite.token}`;
    navigator.clipboard.writeText(link);
    setCopiadoId(convite.id);
    setTimeout(() => setCopiadoId(null), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound size={24} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-white">
          Gerenciar <span className="glow-text">Convites</span>
        </h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Gere um link único e mande pro seu amigo — só com ele é possível criar conta.
      </p>

      <button
        onClick={handleGerar}
        disabled={gerando}
        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg px-5 py-2.5 mb-6 disabled:opacity-50">
        {gerando ? "Gerando..." : "+ Gerar Novo Convite"}
      </button>

      {carregando ? (
        <p className="text-gray-400">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {convites.length === 0 && (
            <div className="glow-card rounded-2xl p-6 text-center text-gray-500">
              Nenhum convite gerado ainda.
            </div>
          )}

          {convites.map((c) => (
            <div key={c.id} className="glow-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-mono font-bold">{c.token}</p>
                <p className="text-xs text-gray-500">
                  {c.usado ? (
                    <span className="text-red-400">já utilizado</span>
                  ) : (
                    <span className="text-emerald-400">disponível</span>
                  )}
                  {" · "}
                  {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                {!c.usado && (
                  <button
                    onClick={() => copiarLink(c)}
                    className="bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-amber-500/20 flex items-center gap-1.5">
                    {copiadoId === c.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiadoId === c.id ? "Copiado!" : "Copiar link"}
                  </button>
                )}
                <button
                  onClick={() => remover(c.id)}
                  className="bg-red-500/10 text-red-400 border border-red-500/25 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-500/20">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

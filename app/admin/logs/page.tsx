"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

type Log = {
  id: string;
  userId: string | null;
  userNome: string | null;
  acao: string;
  detalhes: string | null;
  criadoEm: string;
};

const labelAcao: Record<string, { label: string; cor: string }> = {
  cadastro:        { label: "Cadastro",        cor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  criar_aposta:    { label: "Nova aposta",      cor: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  excluir_aposta:  { label: "Excluiu aposta",   cor: "bg-red-500/15 text-red-400 border-red-500/20" },
  criar_ganho:     { label: "Novo ganho",       cor: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  excluir_ganho:   { label: "Excluiu ganho",    cor: "bg-red-500/15 text-red-400 border-red-500/20" },
  reset_senha:     { label: "Reset de senha",   cor: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  excluir_usuario: { label: "Excluiu usuário",  cor: "bg-red-500/15 text-red-400 border-red-500/20" },
  alterar_role:    { label: "Alterou role",     cor: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((data) => { setLogs(data); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, []);

  const logsFiltrados = filtro === "todos" ? logs : logs.filter((l) => l.acao === filtro);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-2 rounded-lg">
          <Activity size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Log de <span className="glow-text">Atividades</span></h1>
          <p className="text-sm text-gray-500">Histórico de ações dos usuários.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {["todos", ...Object.keys(labelAcao)].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtro === f
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300"
            }`}
          >
            {f === "todos" ? "Todos" : labelAcao[f]?.label ?? f}
          </button>
        ))}
      </div>

      <div className="glow-card rounded-2xl overflow-hidden">
        {carregando ? (
          <p className="text-gray-500 p-6">Carregando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/[0.06]">
                <th className="px-6 py-3">Data/hora</th>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Ação</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum log encontrado.</td>
                </tr>
              )}
              {logsFiltrados.map((l) => {
                const meta = labelAcao[l.acao];
                return (
                  <tr key={l.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(l.criadoEm).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-white text-xs">
                      {l.userNome ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${meta?.cor ?? "bg-gray-500/15 text-gray-300 border-gray-500/20"}`}>
                        {meta?.label ?? l.acao}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {l.detalhes ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

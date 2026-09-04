"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Shield, Trash2, Crown, User, KeyRound, X } from "lucide-react";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  cpf: string | null;
  dataNascimento: string | null;
  criadoEm: string;
  _count: { apostas: number; ganhos: number };
};

export default function AdminPanel() {
  const { data: session } = useSession();
  const meuId = (session?.user as any)?.id;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [resetModal, setResetModal] = useState<{ id: string; nome: string } | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [resetErro, setResetErro] = useState("");
  const [resetSalvando, setResetSalvando] = useState(false);

  async function carregar() {
    const res = await fetch("/api/admin/usuarios");
    if (res.ok) setUsuarios(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function alterarRole(id: string, role: string) {
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Erro ao alterar role.");
      return;
    }
    carregar();
  }

  async function deletar(id: string, nome: string) {
    if (!confirm(`Deletar usuário "${nome}" e todos os seus dados?`)) return;
    const res = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Erro ao deletar usuário.");
      return;
    }
    carregar();
  }

  async function resetarSenha() {
    if (!resetModal) return;
    if (!novaSenha || novaSenha.length < 8) {
      setResetErro("Senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setResetSalvando(true);
    setResetErro("");
    try {
      const res = await fetch(`/api/admin/usuarios/${resetModal.id}/senha`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setResetErro(err.error || "Erro ao resetar senha.");
        return;
      }
      setResetModal(null);
      setNovaSenha("");
    } catch {
      setResetErro("Erro de conexão.");
    } finally {
      setResetSalvando(false);
    }
  }

  function formatarData(iso: string | null) {
    if (!iso) return "—";
    return iso.split("-").reverse().join("/");
  }

  return (
    <div>
      {/* Modal reset senha */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="glow-card glow-border rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white">Resetar senha de <span className="text-amber-400">{resetModal.nome}</span></h2>
              <button onClick={() => { setResetModal(null); setNovaSenha(""); setResetErro(""); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <label className="text-sm text-gray-400">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => { setNovaSenha(e.target.value); setResetErro(""); }}
              placeholder="Mínimo 8 caracteres"
              autoFocus
              className="w-full mt-1 mb-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-amber-500/50 outline-none transition-colors"
            />
            {resetErro && <p className="text-red-400 text-xs mb-3">{resetErro}</p>}
            <button
              onClick={resetarSenha}
              disabled={resetSalvando}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg py-2.5 disabled:opacity-50"
            >
              {resetSalvando ? "Salvando..." : "Confirmar Reset"}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-2 rounded-lg">
          <Shield size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Painel <span className="glow-text">Master</span></h1>
          <p className="text-sm text-gray-500">Controle total de usuários e permissões.</p>
        </div>
      </div>

      <div className="glow-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold text-white">Usuários cadastrados</h2>
          <span className="text-sm text-gray-500">{usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""}</span>
        </div>

        {carregando ? (
          <p className="text-gray-500 p-6">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/[0.06]">
                  <th className="px-6 py-3">Usuário</th>
                  <th className="px-6 py-3">CPF</th>
                  <th className="px-6 py-3">Nascimento</th>
                  <th className="px-6 py-3">Apostas</th>
                  <th className="px-6 py-3">Criado em</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${u.role === "master" ? "bg-amber-500/20" : "bg-white/[0.06]"}`}>
                          {u.role === "master"
                            ? <Crown size={14} className="text-amber-400" />
                            : <User size={14} className="text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.nome}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-xs">
                      {u.cpf ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {formatarData(u.dataNascimento)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {u._count.apostas} apostas · {u._count.ganhos} ganhos
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(u.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        u.role === "master"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          : "bg-gray-500/15 text-gray-300 border-gray-500/20"
                      }`}>
                        {u.role === "master" ? "MASTER" : "USER"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.role !== "master" ? (
                          <button
                            onClick={() => alterarRole(u.id, "master")}
                            className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
                          >
                            <Crown size={12} />
                            Promover
                          </button>
                        ) : (
                          <button
                            onClick={() => alterarRole(u.id, "user")}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:underline"
                          >
                            <User size={12} />
                            Rebaixar
                          </button>
                        )}
                        <span className="text-white/10">|</span>
                        <button
                          onClick={() => deletar(u.id, u.nome)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                        >
                          <Trash2 size={12} />
                          Deletar
                        </button>
                        {(u.role !== "master" || u.id === meuId) && (
                          <>
                            <span className="text-white/10">|</span>
                            <button
                              onClick={() => { setResetModal({ id: u.id, nome: u.nome }); setNovaSenha(""); setResetErro(""); }}
                              className="flex items-center gap-1 text-xs text-amber-400/70 hover:underline hover:text-amber-400"
                            >
                              <KeyRound size={12} />
                              Senha
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

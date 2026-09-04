"use client";

import { useEffect, useState } from "react";
import { User, Lock, CheckCircle2, AlertCircle } from "lucide-react";

function validarSenha(senha: string) {
  return {
    tamanhoOk: senha.length >= 8,
    temMaiuscula: /[A-Z]/.test(senha),
    temMinuscula: /[a-z]/.test(senha),
    temSimbolo: /[^A-Za-z0-9]/.test(senha),
  };
}

export default function Perfil() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((u) => {
        setNome(u.nome ?? "");
        setEmail(u.email ?? "");
        setCpf(u.cpf ?? "");
        setDataNascimento(u.dataNascimento ?? "");
      })
      .catch(() => {});
  }, []);

  const regrasSenha = validarSenha(novaSenha);
  const senhaValida = Object.values(regrasSenha).every(Boolean);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (novaSenha) {
      if (!senhaValida) {
        setErro("A nova senha não atende todos os requisitos.");
        return;
      }
      if (novaSenha !== confirmarSenha) {
        setErro("As senhas não coincidem.");
        return;
      }
    }

    setSalvando(true);
    try {
      const body: any = { nome };
      if (senhaAtual || novaSenha) {
        body.senhaAtual = senhaAtual;
        body.novaSenha = novaSenha;
      }

      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao salvar.");
        return;
      }

      setNome(data.nome);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setSucesso("Perfil atualizado com sucesso!");
      setTimeout(() => setSucesso(""), 3000);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-2 rounded-lg">
          <User size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Meu <span className="glow-text">Perfil</span></h1>
          <p className="text-sm text-gray-500">Gerencie suas informações pessoais.</p>
        </div>
      </div>

      <form onSubmit={handleSalvar} className="flex flex-col gap-5">
        {/* Dados pessoais (somente leitura) */}
        <div className="glow-card rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold text-white text-sm uppercase tracking-wider text-gray-400">Dados da conta</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={salvando}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">CPF</label>
              <input
                type="text"
                value={cpf}
                disabled
                className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2.5 text-gray-500 font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data de nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                disabled
                className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="glow-card rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wider text-gray-400">Alterar senha</h2>
          </div>
          <p className="text-xs text-gray-600 -mt-2">Deixe em branco para manter a senha atual.</p>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="••••••••"
              disabled={salvando}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="••••••••"
              disabled={salvando}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
            />
            {novaSenha && (
              <div className="mt-2 flex flex-col gap-1 text-xs">
                <span className={regrasSenha.tamanhoOk ? "text-emerald-400" : "text-red-400"}>
                  {regrasSenha.tamanhoOk ? "✓" : "✗"} Pelo menos 8 caracteres
                </span>
                <span className={regrasSenha.temMaiuscula ? "text-emerald-400" : "text-red-400"}>
                  {regrasSenha.temMaiuscula ? "✓" : "✗"} Uma letra maiúscula
                </span>
                <span className={regrasSenha.temMinuscula ? "text-emerald-400" : "text-red-400"}>
                  {regrasSenha.temMinuscula ? "✓" : "✗"} Uma letra minúscula
                </span>
                <span className={regrasSenha.temSimbolo ? "text-emerald-400" : "text-red-400"}>
                  {regrasSenha.temSimbolo ? "✓" : "✗"} Um símbolo (ex: !@#$)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              disabled={salvando}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
            />
            {confirmarSenha && (
              <p className={`text-xs mt-1 ${novaSenha === confirmarSenha ? "text-emerald-400" : "text-red-400"}`}>
                {novaSenha === confirmarSenha ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
              </p>
            )}
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
            <AlertCircle size={16} />
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-lg">
            <CheckCircle2 size={16} />
            {sucesso}
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg py-3 transition-all disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
}

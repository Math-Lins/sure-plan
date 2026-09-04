"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatarCPF(valor: string) {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validarSenha(senha: string) {
  return {
    tamanhoOk: senha.length >= 8,
    temMaiuscula: /[A-Z]/.test(senha),
    temMinuscula: /[a-z]/.test(senha),
    temSimbolo: /[^A-Za-z0-9]/.test(senha),
  };
}

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const regrasSenha = validarSenha(senha);
  const senhaValida = Object.values(regrasSenha).every(Boolean);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome || !email || !cpf || !dataNascimento || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (!emailValido(email)) {
      setErro("Digite um e-mail válido.");
      return;
    }
    if (cpf.length < 14) {
      setErro("CPF incompleto.");
      return;
    }
    if (!senhaValida) {
      setErro("A senha não atende todos os requisitos.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, cpf, dataNascimento, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao criar conta.");
        return;
      }

      setSucesso(true);

      // Auto-login após cadastro
      const result = await signIn("credentials", {
        email,
        password: senha,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        <div className="glow-card rounded-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="bg-gradient-to-br from-amber-500 to-purple-600 p-2 rounded-lg">
              <Zap size={20} className="text-black" fill="black" />
            </div>
            <h1 className="text-2xl font-bold glow-text">SureStack</h1>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <UserPlus size={18} className="text-amber-400" />
            <h2 className="text-lg font-bold text-white">Criar Conta</h2>
          </div>

          {sucesso ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={40} className="text-emerald-400" />
              <p className="text-emerald-400 font-medium">Conta criada com sucesso!</p>
              <p className="text-sm text-gray-500">Entrando...</p>
            </div>
          ) : (
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  disabled={salvando}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={salvando}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
                />
                {email && !emailValido(email) && (
                  <p className="text-xs text-red-400 mt-1">✗ E-mail inválido</p>
                )}
                {email && emailValido(email) && (
                  <p className="text-xs text-emerald-400 mt-1">✓ E-mail válido</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  disabled={salvando}
                  required
                  maxLength={14}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 font-mono focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
                />
                {cpf && cpf.length < 14 && (
                  <p className="text-xs text-red-400 mt-1">✗ CPF incompleto</p>
                )}
                {cpf && cpf.length === 14 && (
                  <p className="text-xs text-emerald-400 mt-1">✓ CPF preenchido</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Data de nascimento</label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  disabled={salvando}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={salvando}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
                />
                {senha && (
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
                <label className="block text-sm text-gray-400 mb-2">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={salvando}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
                />
                {confirmarSenha && (
                  <p className={`text-xs mt-1 ${senha === confirmarSenha ? "text-emerald-400" : "text-red-400"}`}>
                    {senha === confirmarSenha ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                  </p>
                )}
              </div>

              {erro && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg py-2.5 hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                <UserPlus size={16} />
                {salvando ? "Criando conta..." : "Criar Conta"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-amber-400 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

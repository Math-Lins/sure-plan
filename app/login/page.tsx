"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, LogIn, UserPlus, Zap } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const result = await signIn("credentials", {
      email,
      password: senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha inválidos.");
      setLoading(false);
    } else if (result?.ok) {
      router.push("/");
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                required
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none disabled:opacity-50 transition-colors"
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                <AlertCircle size={16} />
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg py-2.5 hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <Link
            href="/cadastro"
            className="w-full mt-3 flex items-center justify-center gap-2 border border-white/10 text-gray-300 hover:text-white hover:border-amber-500/30 font-medium rounded-lg py-2.5 transition-colors text-sm"
          >
            <UserPlus size={16} />
            Criar conta
          </Link>

        </div>
      </div>
    </div>
  );
}

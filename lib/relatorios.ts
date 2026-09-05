import { Aposta, calcularRetorno, statusGeralAposta } from "./apostas";
import { Ganho } from "./ganhos";

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function mesAtualIso(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export function somarMes(mesIso: string, delta: number): string {
  const [ano, mes] = mesIso.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  const novoAno = d.getFullYear();
  const novoMes = String(d.getMonth() + 1).padStart(2, "0");
  return `${novoAno}-${novoMes}`;
}

export function nomeMes(mesIso: string): string {
  const [ano, mes] = mesIso.split("-").map(Number);
  return `${MESES_PT[mes - 1]} ${ano}`;
}

export function calcularResumoMes(
  apostas: Aposta[],
  ganhos: Ganho[],
  meta: number,
  mesIso: string
) {
  const apostasDoMes = apostas.filter((a) => a.data.startsWith(mesIso));
  const finalizadas = apostasDoMes.filter((a) => statusGeralAposta(a) === "finalizada");

  const investido = apostasDoMes.reduce(
    (s, a) => s + a.casas.reduce((si, c) => si + c.investimento, 0),
    0
  );

  const lucroApostas = finalizadas.reduce(
    (s, a) => s + (calcularRetorno(a) ?? 0),
    0
  );

  const lucroGanhos = ganhos
    .filter((g) => g.data.startsWith(mesIso))
    .reduce((s, g) => s + (g.tipo === "lucro" ? g.valor : -g.valor), 0);

  const lucro = lucroApostas + lucroGanhos;
  const roi = investido > 0 ? (lucroApostas / investido) * 100 : 0;
  const metaBatida = lucro >= meta;

  return { investido, lucro, roi, meta, metaBatida };
}

export type StatusCasa = "pendente" | "ganhou" | "perdeu" | "devolvida" | "cashout";

export type Casa = {
  id: string;
  nome: string;
  odd: number;
  investimento: number;
  status: StatusCasa;
  valorCashout?: number | null;
};

export type Aposta = {
  id: string;
  data: string;
  horario: string;
  mercado: string;
  observacao?: string | null;
  casas: Casa[];
};

export function calcularRetornoCasa(casa: Casa): number {
  switch (casa.status) {
    case "ganhou":
      return casa.investimento * casa.odd;
    case "perdeu":
      return 0;
    case "devolvida":
      return casa.investimento;
    case "cashout":
      return casa.valorCashout ?? 0;
    default:
      return casa.investimento;
  }
}

export function statusGeralAposta(aposta: Aposta): "pendente" | "finalizada" {
  return aposta.casas.some((c) => c.status === "pendente") ? "pendente" : "finalizada";
}

export function calcularRetorno(aposta: Aposta): number | null {
  if (statusGeralAposta(aposta) === "pendente") return null;
  const totalRetorno = aposta.casas.reduce((s, c) => s + calcularRetornoCasa(c), 0);
  const totalInvestido = aposta.casas.reduce((s, c) => s + c.investimento, 0);
  return totalRetorno - totalInvestido;
}

export function calcularROI(aposta: Aposta): number | null {
  if (statusGeralAposta(aposta) === "pendente") return null;
  const totalInvestido = aposta.casas.reduce((s, c) => s + c.investimento, 0);
  if (totalInvestido === 0) return null;
  const lucro = calcularRetorno(aposta) ?? 0;
  return parseFloat(((lucro / totalInvestido) * 100).toFixed(2));
}

export type TipoGanho = "lucro" | "perda";

export type Ganho = {
  id: string;
  data: string;
  tipo: TipoGanho;
  casa: string;
  valor: number;
  observacao?: string | null;
};

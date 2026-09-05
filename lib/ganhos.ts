export type Ganho = {
  id: string;
  data: string;
  tipo: "lucro" | "prejuizo";
  casa: string;
  valor: number;
  observacao?: string | null;
};

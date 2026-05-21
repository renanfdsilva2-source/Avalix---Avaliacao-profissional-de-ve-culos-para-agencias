import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlacaData {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  combustivel: string;
  municipio: string;
  uf: string;
  situacao: string;
  fipe: string | null;
}

export function usePlacaLookup() {
  const [loading, setLoading] = useState(false);

  const consultarPlaca = async (placa: string): Promise<PlacaData | null> => {
    const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (placaLimpa.length < 7) {
      toast.error("Informe uma placa válida (ex: ABC1234 ou ABC1D23).");
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("consulta-placa", {
        body: { placa: placaLimpa },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      toast.success("Dados do veículo carregados!");
      return data as PlacaData;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar placa.";
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { consultarPlaca, loading };
}

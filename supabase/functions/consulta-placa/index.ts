// Edge Function: consulta-placa
// Consulta dados do veículo pela placa usando a API WDAPI2.
// A chave de API fica segura no servidor (variável de ambiente do Supabase).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { placa } = await req.json();

    if (!placa || placa.length < 7) {
      return json({ error: "Placa inválida. Informe no mínimo 7 caracteres." }, 400);
    }

    const token = Deno.env.get("PLACA_API_KEY");
    if (!token) {
      return json({ error: "Chave de API não configurada no servidor." }, 500);
    }

    const placaFormatada = placa.replace(/[^A-Z0-9]/g, "").toUpperCase();
    const url = `https://wdapi2.com.br/consulta/${placaFormatada}/${token}`;

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return json({ error: `Erro na API de placa: ${response.status}` }, response.status);
    }

    const data = await response.json();

    // Verifica se a API retornou erro
    if (data.erro || data.error || data.message?.toLowerCase().includes("não encontrado")) {
      return json({ error: "Placa não encontrada ou inválida." }, 404);
    }

    // Normaliza os campos retornados pela API
    return json({
      placa: data.PLACA ?? placaFormatada,
      marca: data.MARCA ?? "",
      modelo: data.MODELO ?? "",
      ano: data.ano ?? data.ANO ?? data.anoModelo ?? "",
      cor: data.cor ?? data.COR ?? "",
      combustivel: data.combustivel ?? data.COMBUSTIVEL ?? "",
      municipio: data.municipio ?? data.MUNICIPIO ?? "",
      uf: data.uf ?? data.UF ?? "",
      situacao: data.situacao ?? data.SITUACAO ?? "",
      fipe: data.fipe ?? null,
    });
  } catch (e) {
    console.error("consulta-placa error", e);
    return json({ error: "Erro interno ao consultar a placa." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

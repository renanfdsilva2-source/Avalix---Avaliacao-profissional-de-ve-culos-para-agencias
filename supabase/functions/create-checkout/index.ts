// Cria uma sess\u00e3o de Checkout Stripe para o usu\u00e1rio autenticado.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string) ?? "";
    if (!email) return json({ error: "Email do usu\u00e1rio n\u00e3o dispon\u00edvel" }, 400);

    const body = await req.json().catch(() => ({}));
    const priceId: string | undefined = body.priceId;
    if (!priceId || !priceId.startsWith("price_")) {
      return json({ error: "priceId inv\u00e1lido" }, 400);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    const admin = createClient(supabaseUrl, serviceKey);

    // Recupera ou cria customer
    const { data: existing } = await admin
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const found = await stripe.customers.list({ email, limit: 1 });
      customerId = found.data[0]?.id;
    }
    if (!customerId) {
      const created = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = created.id;
    }

    const origin = req.headers.get("origin") ?? "https://avalix.app.br";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?status=canceled`,
      client_reference_id: userId,
      subscription_data: { metadata: { supabase_user_id: userId } },
      metadata: { supabase_user_id: userId },
    });

    await admin.from("subscribers").upsert(
      {
        user_id: userId,
        email,
        stripe_customer_id: customerId,
        status: existing ? undefined : "inactive",
      },
      { onConflict: "user_id" },
    );

    return json({ url: session.url });
  } catch (e) {
    console.error("create-checkout error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

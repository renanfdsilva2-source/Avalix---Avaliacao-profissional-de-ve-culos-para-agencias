// Consulta o status real da assinatura no Stripe e sincroniza com a tabela subscribers.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });
    const admin = createClient(supabaseUrl, serviceKey);

    // Localiza customer
    const { data: row } = await admin
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = row?.stripe_customer_id ?? undefined;
    if (!customerId && email) {
      const list = await stripe.customers.list({ email, limit: 1 });
      customerId = list.data[0]?.id;
    }

    if (!customerId) {
      await admin.from("subscribers").upsert(
        { user_id: userId, email, status: "inactive" },
        { onConflict: "user_id" },
      );
      return json({ active: false, status: "inactive" });
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    const sub = subs.data[0];
    const active = !!sub && ["active", "trialing"].includes(sub.status);

    await admin.from("subscribers").upsert(
      {
        user_id: userId,
        email,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub?.id ?? null,
        stripe_price_id: sub?.items.data[0]?.price.id ?? null,
        plan: sub?.items.data[0]?.price.nickname ?? sub?.items.data[0]?.price.id ?? null,
        status: sub?.status ?? "inactive",
        current_period_end: sub?.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: sub?.cancel_at_period_end ?? false,
        canceled_at: sub?.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      },
      { onConflict: "user_id" },
    );

    return json({
      active,
      status: sub?.status ?? "inactive",
      current_period_end: sub?.current_period_end ?? null,
      cancel_at_period_end: sub?.cancel_at_period_end ?? false,
      plan: sub?.items.data[0]?.price.id ?? null,
    });
  } catch (e) {
    console.error("check-subscription error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

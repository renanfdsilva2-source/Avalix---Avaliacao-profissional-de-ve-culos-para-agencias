// Webhook do Stripe. P\u00fablico (verify_jwt=false). Valida assinatura HMAC, idempotente.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !webhookSecret) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Invalid webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // Idempot\u00eancia: se j\u00e1 processamos esse event_id pra esse customer, ignora.
    const customerId = extractCustomerId(event);
    if (customerId) {
      const { data: existing } = await admin
        .from("subscribers")
        .select("last_event_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (existing?.last_event_id === event.id) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSubscriptionSync(session.customer as string, event.id);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(sub, event.id);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await admin
          .from("subscribers")
          .update({ last_payment_status: "paid", last_event_id: event.id })
          .eq("stripe_customer_id", invoice.customer as string);
        if (invoice.subscription) {
          await handleSubscriptionSync(invoice.customer as string, event.id);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await admin
          .from("subscribers")
          .update({
            last_payment_status: "failed",
            status: "past_due",
            last_event_id: event.id,
          })
          .eq("stripe_customer_id", invoice.customer as string);
        break;
      }
      default:
        console.log("Unhandled event", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});

function extractCustomerId(event: Stripe.Event): string | null {
  const obj = event.data.object as Record<string, unknown>;
  const c = (obj.customer ?? null) as string | null;
  return typeof c === "string" ? c : null;
}

async function handleSubscriptionSync(customerId: string, eventId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const sub = subs.data[0];
  if (!sub) return;
  await upsertFromSubscription(sub, eventId);
}

async function upsertFromSubscription(sub: Stripe.Subscription, eventId: string) {
  const customerId = sub.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if ((customer as Stripe.DeletedCustomer).deleted) return;
  const c = customer as Stripe.Customer;
  const userId =
    (sub.metadata?.supabase_user_id as string | undefined) ??
    (c.metadata?.supabase_user_id as string | undefined);
  const email = c.email ?? "";

  if (!userId) {
    console.warn("Subscription sem supabase_user_id em metadata", sub.id);
    return;
  }

  await admin.from("subscribers").upsert(
    {
      user_id: userId,
      email,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: sub.items.data[0]?.price.id ?? null,
      plan: sub.items.data[0]?.price.nickname ?? sub.items.data[0]?.price.id ?? null,
      status: sub.status,
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      last_event_id: eventId,
    },
    { onConflict: "user_id" },
  );
}

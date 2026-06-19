import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#0a0a0b;color:#f5f5f4;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#141416;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:32px;">
    <p style="color:#d4af37;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Judge TCG</p>
    <h1 style="font-weight:300;font-size:24px;margin:16px 0;">${title}</h1>
    <div style="line-height:1.6;color:#a8a29e;">${body.replace(/\n/g, "<br>")}</div>
    <p style="margin-top:32px;font-size:12px;color:#78716c;">
      <a href="https://judgetcg.com.br" style="color:#d4af37;">judgetcg.com.br</a>
    </p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { newsletterId } = (await req.json()) as { newsletterId?: string };
    if (!newsletterId) {
      return new Response(JSON.stringify({ error: "newsletterId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: "tcg_judge" },
    });

    const { data: newsletter, error: nlErr } = await supabase
      .from("newsletters")
      .select("*")
      .eq("id", newsletterId)
      .single();
    if (nlErr || !newsletter) throw new Error("Newsletter não encontrada");

    const { data: subscribers } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .is("unsubscribed_at", null);

    const emails = (subscribers ?? []).map((s) => s.email).filter(Boolean);
    const html = htmlTemplate(newsletter.title, newsletter.content);

    if (RESEND_API_KEY && emails.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Judge TCG <newsletter@judgetcg.com.br>",
            to: batch,
            subject: newsletter.title,
            html,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Resend: ${errText}`);
        }
      }
    }

    await supabase
      .from("newsletters")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", newsletterId);

    return new Response(
      JSON.stringify({
        ok: true,
        sentTo: emails.length,
        emailProvider: RESEND_API_KEY ? "resend" : "placeholder",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

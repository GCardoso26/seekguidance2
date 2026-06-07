#!/usr/bin/env node
/**
 * Stripe Setup Script — Judge TCG
 *
 * Automatiza: produtos, prices, webhook e ficheiros .env de exemplo.
 *
 * Uso:
 *   node scripts/setup-stripe.js --env=test
 *   node scripts/setup-stripe.js --env=live
 *
 * Requer: npm install em scripts/ (ver scripts/package.json)
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const DEFAULT_WEBHOOK_URL =
  "https://seekguidance.onrender.com/runtime/judge/stripe/webhook";

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const PRODUCTS = {
  spike: {
    name: "Judge TCG — Spike (PRO)",
    description:
      "Plano PRO para jogadores competitivos. Analytics avançadas, export de decks, criação de torneios.",
    metadata: { tier: "spike", plan: "pro" },
  },
  team: {
    name: "Judge TCG — Equipe (Team)",
    description:
      "Plano Team para equipas e organizadores. Gestão de equipa, branding customizado, API access.",
    metadata: { tier: "team", plan: "team" },
  },
};

/** Prices em USD (centavos). Anual = valor total cobrado por ano. */
function buildPriceDefinitions(productIds) {
  return [
    {
      key: "spike_monthly",
      product: productIds.spike,
      nickname: "Spike — Mensal",
      unit_amount: 1500,
      currency: "usd",
      recurring: { interval: "month", trial_period_days: 14 },
      metadata: { tier: "spike", billing_cycle: "monthly" },
    },
    {
      key: "spike_annual",
      product: productIds.spike,
      nickname: "Spike — Anual (-20%)",
      unit_amount: 14400,
      currency: "usd",
      recurring: { interval: "year", trial_period_days: 14 },
      metadata: { tier: "spike", billing_cycle: "annual" },
    },
    {
      key: "team_monthly",
      product: productIds.team,
      nickname: "Equipe — Mensal",
      unit_amount: 4900,
      currency: "usd",
      recurring: { interval: "month", trial_period_days: 14 },
      metadata: { tier: "team", billing_cycle: "monthly" },
    },
    {
      key: "team_annual",
      product: productIds.team,
      nickname: "Equipe — Anual (-20%)",
      unit_amount: 46800,
      currency: "usd",
      recurring: { interval: "year", trial_period_days: 14 },
      metadata: { tier: "team", billing_cycle: "annual" },
    },
  ];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

function parseEnvArg() {
  if (process.argv.includes("--env=live")) return "live";
  if (process.argv.includes("--env=test")) return "test";
  return "test";
}

function secretKeyPrefix(env) {
  return `sk_${env}_`;
}

function publishableFromSecret(secret) {
  return secret.replace(/^sk_(test|live)_/, "pk_$1_");
}

async function findProductByName(stripeClient, name) {
  try {
    const search = await stripeClient.products.search({
      query: `name:'${name.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    if (search.data.length > 0) return search.data[0];
  } catch {
    /* search pode não estar disponível em contas antigas */
  }
  const list = await stripeClient.products.list({ limit: 100, active: true });
  return list.data.find((p) => p.name === name) ?? null;
}

async function findMatchingPrice(stripeClient, productId, priceData) {
  const existing = await stripeClient.prices.list({
    product: productId,
    limit: 100,
    active: true,
  });
  return (
    existing.data.find(
      (p) =>
        p.unit_amount === priceData.unit_amount &&
        p.currency === priceData.currency &&
        p.recurring?.interval === priceData.recurring.interval &&
        (p.recurring?.trial_period_days ?? 0) ===
          (priceData.recurring.trial_period_days ?? 0),
    ) ?? null
  );
}

async function main() {
  const env = parseEnvArg();
  const isLive = env === "live";

  console.log(`🎴 Judge TCG — Stripe Setup (${env.toUpperCase()})`);
  console.log("=".repeat(50));
  console.log();

  let apiKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) {
    console.log("🔑 Stripe API Key não encontrada no ambiente.");
    apiKey = (await question(`Insere a tua ${env} Secret Key (sk_${env}_...): `)).trim();
  }

  const expectedPrefix = secretKeyPrefix(env);
  if (!apiKey.startsWith(expectedPrefix)) {
    console.error(`❌ API Key inválida. Deve começar com ${expectedPrefix}`);
    process.exit(1);
  }

  let stripeClient;
  try {
    const stripe = require("stripe");
    stripeClient = stripe(apiKey);
  } catch (err) {
    console.error("❌ Pacote stripe não instalado. Corre: cd scripts && npm install");
    console.error(err.message);
    process.exit(1);
  }

  const output = {
    products: {},
    prices: {},
    webhook_secret: null,
    webhook_url: null,
  };

  try {
    const account = await stripeClient.accounts.retrieve();
    const label =
      account.settings?.dashboard?.display_name ||
      account.business_profile?.name ||
      account.id;
    console.log(`✅ Conectado à conta: ${label}`);
    console.log();

    console.log("📦 A criar produtos...");
    for (const [key, productData] of Object.entries(PRODUCTS)) {
      const existing = await findProductByName(stripeClient, productData.name);
      if (existing) {
        console.log(`  ⚠️  ${productData.name} já existe (${existing.id})`);
        output.products[key] = existing;
      } else {
        const product = await stripeClient.products.create(productData);
        console.log(`  ✅ ${product.name} → ${product.id}`);
        output.products[key] = product;
      }
    }
    console.log();

    console.log("💰 A criar prices...");
    const priceDefs = buildPriceDefinitions({
      spike: output.products.spike.id,
      team: output.products.team.id,
    });

    for (const def of priceDefs) {
      const { key, ...priceData } = def;
      const match = await findMatchingPrice(stripeClient, priceData.product, priceData);
      if (match) {
        console.log(`  ⚠️  ${def.nickname} já existe (${match.id})`);
        output.prices[key] = match;
      } else {
        const price = await stripeClient.prices.create(priceData);
        const label =
          def.recurring.interval === "year"
            ? `$${(price.unit_amount / 100).toFixed(2)}/ano`
            : `$${(price.unit_amount / 100).toFixed(2)}/mês`;
        console.log(`  ✅ ${def.nickname} → ${price.id} (${label})`);
        output.prices[key] = price;
      }
    }
    console.log();

    console.log("🔗 Webhook (Enter para usar URL por defeito do Render)");
    const webhookInput = await question(
      `URL do webhook [${DEFAULT_WEBHOOK_URL}]: `,
    );
    const webhookUrl = (webhookInput.trim() || DEFAULT_WEBHOOK_URL).trim();
    output.webhook_url = webhookUrl;

    if (webhookUrl) {
      const existingWebhooks = await stripeClient.webhookEndpoints.list({ limit: 20 });
      const match = existingWebhooks.data.find((wh) => wh.url === webhookUrl);

      if (match) {
        console.log(`  ⚠️  Webhook já existe (${match.id})`);
        console.log(
          "  ℹ️  O signing secret só é mostrado na criação. Se não o tens, apaga o endpoint no Dashboard e volta a correr o script.",
        );
      } else {
        const webhook = await stripeClient.webhookEndpoints.create({
          url: webhookUrl,
          enabled_events: WEBHOOK_EVENTS,
          description: `Judge TCG — ${env.toUpperCase()} Webhook`,
        });
        console.log(`  ✅ Webhook criado → ${webhook.id}`);
        console.log(`  🔑 Signing secret: ${webhook.secret}`);
        output.webhook_secret = webhook.secret;
      }
    }
    console.log();

    console.log("📝 A gerar ficheiros de configuração...");
    const publishableKey = publishableFromSecret(apiKey);
    const whSecret = output.webhook_secret || "whsec_COLOQUE_AQUI";

    const envLocal = `# Judge TCG — Stripe (${env}) — copiar para frontend/runtime_console_v3/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${publishableKey}
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_SPIKE=${output.prices.spike_monthly?.id ?? ""}
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_SPIKE=${output.prices.spike_annual?.id ?? ""}
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEAM=${output.prices.team_monthly?.id ?? ""}
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_TEAM=${output.prices.team_annual?.id ?? ""}
`;

    const envBackend = `# Judge TCG — Stripe (${env}) — copiar para services/api/.env
STRIPE_SECRET_KEY=${apiKey}
STRIPE_WEBHOOK_SECRET=${whSecret}
STRIPE_PRICE_MONTHLY_SPIKE=${output.prices.spike_monthly?.id ?? ""}
STRIPE_PRICE_ANNUAL_SPIKE=${output.prices.spike_annual?.id ?? ""}
STRIPE_PRICE_MONTHLY_TEAM=${output.prices.team_monthly?.id ?? ""}
STRIPE_PRICE_ANNUAL_TEAM=${output.prices.team_annual?.id ?? ""}
STRIPE_TRIAL_DAYS=14
STRIPE_CHECKOUT_SUCCESS_URL=https://judgetcg.com.br/payment/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CHECKOUT_CANCEL_URL=https://judgetcg.com.br/pricing
`;

    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const localPath = path.join(outputDir, `.env.local.stripe.${env}`);
    const backendPath = path.join(outputDir, `.env.stripe.${env}`);
    fs.writeFileSync(localPath, envLocal, "utf8");
    fs.writeFileSync(backendPath, envBackend, "utf8");

    console.log(`  ✅ ${path.relative(process.cwd(), localPath)}`);
    console.log(`  ✅ ${path.relative(process.cwd(), backendPath)}`);
    console.log();

    console.log("=".repeat(50));
    console.log("✅ SETUP CONCLUÍDO");
    console.log("=".repeat(50));
    console.log();
    console.log("📦 Produtos:");
    console.log(`  Spike (PRO):  ${output.products.spike.id}`);
    console.log(`  Equipe (Team): ${output.products.team.id}`);
    console.log();
    console.log("💰 Prices:");
    console.log(`  Spike Mensal:  ${output.prices.spike_monthly?.id} ($15/mês)`);
    console.log(`  Spike Anual:   ${output.prices.spike_annual?.id} ($144/ano, ~$12/mês)`);
    console.log(`  Equipe Mensal: ${output.prices.team_monthly?.id} ($49/mês)`);
    console.log(`  Equipe Anual:  ${output.prices.team_annual?.id} ($468/ano, ~$39/mês)`);
    console.log();
    console.log("🔗 Webhook:");
    console.log(`  URL: ${output.webhook_url}`);
    console.log(
      `  Secret: ${output.webhook_secret ? "✅ (ver ficheiro .env.stripe)" : "⚠️  reutilizado — confirma no Dashboard"}`,
    );
    console.log();
    console.log("⚠️  Próximos passos:");
    console.log("  1. Copiar scripts/output/*.env.* para .env.local e services/api/.env");
    console.log("  2. Teste local: stripe listen --forward-to localhost:8000/runtime/judge/stripe/webhook");
    console.log("  3. Cartão de teste: 4242 4242 4242 4242");
    if (isLive) {
      console.log("  4. Modo LIVE: confirma que a conta Stripe está ativada para pagamentos reais");
    }
    console.log();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.type === "StripeAuthenticationError") {
      console.error(`   → Verifica se a API key é do ambiente ${env} (${expectedPrefix}...)`);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

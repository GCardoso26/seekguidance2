import { createSupabaseServiceClient } from "./supabase-client";

async function ensureUser(email: string, password: string, metadata: Record<string, string>) {
  const admin = createSupabaseServiceClient();

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user;
}

/** Garante usuários de teste no Supabase (service role). */
export async function ensureTestUsers() {
  await ensureUser("test-buyer@judgetcg.com", "TestBuyer123!", {
    name: "Test Buyer",
    full_name: "Test Buyer",
  });
  await ensureUser("test-seller@judgetcg.com", "TestSeller123!", {
    name: "Test Seller",
    full_name: "Test Seller",
  });
  await ensureUser("test-buyer-b@judgetcg.com", "TestBuyerB123!", {
    name: "Test Buyer B",
    full_name: "Test Buyer B",
  });
}

export const E2E_TEST_ACCOUNTS = [
  { email: "test-buyer@judgetcg.com", password: "TestBuyer123!", file: "buyer.json", role: "buyer" },
  { email: "test-buyer-b@judgetcg.com", password: "TestBuyerB123!", file: "buyer-b.json", role: "buyer-b" },
  { email: "test-seller@judgetcg.com", password: "TestSeller123!", file: "seller.json", role: "seller" },
] as const;

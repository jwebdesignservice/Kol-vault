import { NextRequest } from "next/server";
import { requireAuth, getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptPrivateKey } from "@/lib/crypto/escrow";
import { apiSuccess, apiError } from "@/lib/api/response";
import { Keypair } from "@solana/web3.js";
import { getUsdcBalance } from "@/lib/solana/escrow-ops";

type RouteContext = { params: { dealId: string } };

/**
 * GET /api/escrow/[dealId]
 * Returns escrow wallet public info (public_key and balance_usdc only).
 * Accessible to: project owner or accepted KOL on the deal.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { dealId } = params;
    const user = await getUser(req);
    if (!user) return apiError("Unauthorized", 401);

    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id, accepted_kol_id")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    let hasAccess = false;

    if (user.role === "admin") {
      hasAccess = true;
    } else if (user.role === "project") {
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      hasAccess = !!projectProfile && deal.project_id === projectProfile.id;
    } else if (user.role === "kol") {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      hasAccess = !!kolProfile && deal.accepted_kol_id === kolProfile.id;
    }

    if (!hasAccess) return apiError("Forbidden", 403);

    const { data: wallet } = await supabase
      .from("escrow_wallets")
      .select("id, deal_id, public_key, funded_at, released_at, balance_usdc, created_at")
      .eq("deal_id", dealId)
      .single();

    if (!wallet) return apiError("Escrow wallet not found for this deal", 404);

    let live_balance_usdc: number = wallet.balance_usdc ?? 0;
    try {
      live_balance_usdc = await getUsdcBalance(wallet.public_key);
    } catch (err) {
      console.warn("[escrow/[dealId] GET] RPC balance fetch failed, using DB value", err);
    }

    return apiSuccess({ wallet: { ...wallet, live_balance_usdc } });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[escrow/[dealId] GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/escrow/[dealId]
 * Create an escrow wallet for a deal. Project owner only.
 * Generates a Solana Keypair, encrypts the private key, stores both.
 * Returns only the public_key.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { dealId } = params;
    const user = await requireAuth(req, "project");
    const supabase = createAdminClient();

    const { data: projectProfile } = await supabase
      .from("project_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!projectProfile) return apiError("Project profile not found", 400);

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.project_id !== projectProfile.id) return apiError("Forbidden", 403);

    // Check no existing escrow wallet
    const { data: existing } = await supabase
      .from("escrow_wallets")
      .select("id, public_key")
      .eq("deal_id", dealId)
      .single();

    if (existing) {
      return apiError("An escrow wallet already exists for this deal.", 409);
    }

    // Generate Solana keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();

    // Convert secretKey (Uint8Array) to base64 string for encryption
    const privateKeyB64 = Buffer.from(keypair.secretKey).toString("base64");
    const encryptedPrivateKey = encryptPrivateKey(privateKeyB64);

    const { data: wallet, error } = await supabase
      .from("escrow_wallets")
      .insert({
        deal_id: dealId,
        public_key: publicKey,
        encrypted_private_key: encryptedPrivateKey,
      })
      .select("id, deal_id, public_key, balance_usdc, created_at")
      .single();

    if (error) {
      console.error("[escrow/[dealId] POST] insert error", error);
      return apiError("Failed to create escrow wallet", 500);
    }

    return apiSuccess({ wallet }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[escrow/[dealId] POST]", res);
    return apiError("Internal server error", 500);
  }
}

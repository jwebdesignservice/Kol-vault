import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ReleaseSchema } from "@/lib/validation/schemas";
import { getUsdcBalance, transferUsdcFromEscrow } from "@/lib/solana/escrow-ops";

type RouteContext = { params: { dealId: string } };

/**
 * POST /api/admin/escrow/[dealId]/release
 * Release USDC from escrow to the accepted KOL. Admin only.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth(req, "admin");
    const { dealId } = params;
    const supabase = createAdminClient();

    // Parse optional body
    let body: { amount_usdc?: number } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine
    }
    const parsed = ReleaseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // Fetch deal — must be completed
    const { data: deal } = await supabase
      .from("deals")
      .select("id, accepted_kol_id, platform_fee_bps, status")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.status !== "completed") {
      return apiError("Deal must be in 'completed' status to release escrow", 400);
    }
    if (!deal.accepted_kol_id) {
      return apiError("Deal has no accepted KOL", 400);
    }

    // Fetch KOL's Solana wallet address
    const { data: kolProfile } = await supabase
      .from("kol_profiles")
      .select("solana_wallet_address")
      .eq("id", deal.accepted_kol_id)
      .single();

    if (!kolProfile?.solana_wallet_address) {
      return apiError("KOL has no Solana wallet address on file", 400);
    }

    // Fetch escrow wallet
    const { data: wallet } = await supabase
      .from("escrow_wallets")
      .select("id, public_key, encrypted_private_key")
      .eq("deal_id", dealId)
      .single();

    if (!wallet) return apiError("Escrow wallet not found for this deal", 404);

    // Get live USDC balance
    const liveBalance = await getUsdcBalance(wallet.public_key);

    const platformFeeBps: number = deal.platform_fee_bps ?? 0;
    const protocolFee = (liveBalance * platformFeeBps) / 10000;
    const netPayout = parsed.data.amount_usdc ?? (liveBalance - protocolFee);

    if (liveBalance <= 0 || netPayout <= 0) {
      return apiError("Escrow wallet has no balance to release", 400);
    }

    // Execute on-chain transfer
    const result = await transferUsdcFromEscrow(
      wallet.encrypted_private_key,
      wallet.public_key,
      kolProfile.solana_wallet_address,
      netPayout
    );

    // Update escrow wallet
    await supabase
      .from("escrow_wallets")
      .update({ released_at: new Date().toISOString(), balance_usdc: 0 })
      .eq("id", wallet.id);

    // Update platform_fees record with tx signature
    await supabase
      .from("platform_fees")
      .update({ tx_signature: result.txSignature, collected_at: new Date().toISOString() })
      .eq("deal_id", dealId);

    return apiSuccess({
      txSignature: result.txSignature,
      amountUsdc: netPayout,
      feeUsdc: liveBalance - netPayout,
      kolWallet: kolProfile.solana_wallet_address,
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/escrow/[dealId]/release POST]", res);
    return apiError("Internal server error", 500);
  }
}

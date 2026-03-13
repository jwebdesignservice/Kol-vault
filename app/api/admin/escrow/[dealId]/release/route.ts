export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReleaseSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { transferUsdcFromEscrow } from "@/lib/solana/escrow-ops";
import { calculateFee } from "@/lib/scoring/kol-score";

export async function POST(req: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("*, accepted_kol_id, platform_fee_bps").eq("id", params.dealId).single();
    if (!deal) return apiError("Deal not found", 404);
    if (!deal.accepted_kol_id) return apiError("No KOL assigned to this deal", 400);

    const { data: wallet } = await supabase.from("escrow_wallets").select("*").eq("deal_id", params.dealId).single();
    if (!wallet) return apiError("Escrow wallet not found", 404);
    if (wallet.released_at) return apiError("Escrow already released", 400);

    const { data: kolProfile } = await supabase.from("kol_profiles").select("solana_wallet_address, display_name").eq("id", deal.accepted_kol_id).single();
    if (!kolProfile?.solana_wallet_address) return apiError("KOL has no Solana wallet address on file", 400);

    const body = await req.json();
    const parsed = ReleaseSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const totalAmount = parsed.data.amount_usdc ?? wallet.balance_usdc;
    const feeAmount = calculateFee(totalAmount, deal.platform_fee_bps ?? 400);
    const kolAmount = totalAmount - feeAmount;
    if (kolAmount <= 0) return apiError("Invalid release amount after fee", 400);

    const result = await transferUsdcFromEscrow(wallet.encrypted_private_key, wallet.public_key, kolProfile.solana_wallet_address, kolAmount);

    await supabase.from("platform_fees").insert({ deal_id: params.dealId, fee_usdc: feeAmount, fee_bps: deal.platform_fee_bps ?? 400, collected_at: new Date().toISOString(), tx_signature: result.txSignature });
    await supabase.from("escrow_wallets").update({ released_at: new Date().toISOString(), balance_usdc: 0 }).eq("id", wallet.id);
    await supabase.from("deals").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", params.dealId);

    return apiSuccess({ released: true, tx_signature: result.txSignature, kol_amount_usdc: kolAmount, fee_usdc: feeAmount, kol_wallet: kolProfile.solana_wallet_address });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/escrow/[dealId]/release POST]", res);
    return apiError("Internal server error", 500);
  }
}

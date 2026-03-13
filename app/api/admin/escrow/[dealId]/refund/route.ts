export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { RefundSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { transferUsdcFromEscrow } from "@/lib/solana/escrow-ops";

export async function POST(req: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: wallet } = await supabase.from("escrow_wallets").select("*").eq("deal_id", params.dealId).single();
    if (!wallet) return apiError("Escrow wallet not found", 404);
    if (wallet.released_at) return apiError("Escrow already released", 400);

    const body = await req.json();
    const parsed = RefundSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const amountUsdc = parsed.data.amount_usdc ?? wallet.balance_usdc;
    if (!amountUsdc || amountUsdc <= 0) return apiError("Invalid refund amount", 400);

    const result = await transferUsdcFromEscrow(wallet.encrypted_private_key, wallet.public_key, parsed.data.to_wallet, amountUsdc);

    await supabase.from("escrow_wallets").update({ released_at: new Date().toISOString(), balance_usdc: 0 }).eq("id", wallet.id);
    await supabase.from("deals").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", params.dealId);

    return apiSuccess({ refunded: true, tx_signature: result.txSignature, amount_usdc: amountUsdc, to_wallet: parsed.data.to_wallet });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/escrow/[dealId]/refund POST]", res);
    return apiError("Internal server error", 500);
  }
}

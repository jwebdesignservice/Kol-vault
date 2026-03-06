import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { RefundSchema } from "@/lib/validation/schemas";
import { getUsdcBalance, transferUsdcFromEscrow } from "@/lib/solana/escrow-ops";

type RouteContext = { params: { dealId: string } };

/**
 * POST /api/admin/escrow/[dealId]/refund
 * Refund USDC from escrow back to the project's wallet. Admin only.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth(req, "admin");
    const { dealId } = params;
    const supabase = createAdminClient();

    const body = await req.json();
    const parsed = RefundSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // Fetch deal (any status — refund may happen on cancelled/disputed)
    const { data: deal } = await supabase
      .from("deals")
      .select("id, status")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    // Fetch escrow wallet
    const { data: wallet } = await supabase
      .from("escrow_wallets")
      .select("id, public_key, encrypted_private_key")
      .eq("deal_id", dealId)
      .single();

    if (!wallet) return apiError("Escrow wallet not found for this deal", 404);

    // Get live USDC balance
    const liveBalance = await getUsdcBalance(wallet.public_key);

    const amount = parsed.data.amount_usdc ?? liveBalance;

    if (amount <= 0) {
      return apiError("Escrow wallet has no balance to refund", 400);
    }

    // Execute on-chain transfer
    const result = await transferUsdcFromEscrow(
      wallet.encrypted_private_key,
      wallet.public_key,
      parsed.data.to_wallet,
      amount
    );

    // Update escrow wallet
    await supabase
      .from("escrow_wallets")
      .update({ released_at: new Date().toISOString(), balance_usdc: 0 })
      .eq("id", wallet.id);

    return apiSuccess({
      txSignature: result.txSignature,
      amountUsdc: amount,
      toWallet: parsed.data.to_wallet,
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/escrow/[dealId]/refund POST]", res);
    return apiError("Internal server error", 500);
  }
}

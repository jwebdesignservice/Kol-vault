export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getUsdcBalance } from "@/lib/solana/escrow-ops";

export async function GET(req: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id").eq("id", params.dealId).single();
    if (!deal) return apiError("Deal not found", 404);

    if (user.role !== "admin") {
      let hasAccess = false;
      if (user.role === "project") {
        const { data: p } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = p?.id === deal.project_id;
      } else if (user.role === "kol") {
        const { data: k } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = k?.id === deal.accepted_kol_id;
      }
      if (!hasAccess) return apiError("Forbidden", 403);
    }

    const { data: wallet, error } = await supabase
      .from("escrow_wallets")
      .select("id, deal_id, public_key, funded_at, released_at, balance_usdc, created_at")
      .eq("deal_id", params.dealId).single();
    if (error || !wallet) return apiError("Escrow wallet not found", 404);

    let liveBalance = wallet.balance_usdc;
    try { liveBalance = await getUsdcBalance(wallet.public_key); } catch { /* fallback to stored */ }

    return apiSuccess({ wallet: { ...wallet, live_balance_usdc: liveBalance } });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[escrow/[dealId] GET]", res);
    return apiError("Internal server error", 500);
  }
}

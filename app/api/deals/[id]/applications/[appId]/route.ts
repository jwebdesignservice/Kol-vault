export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewApplicationSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendApplicationStatusEmail, sendDealInProgressEmails } from "@/lib/email/service";
import { Keypair } from "@solana/web3.js";
import { encryptPrivateKey } from "@/lib/crypto/escrow";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; appId: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: application, error: fetchError } = await supabase.from("applications").select("*").eq("id", params.appId).eq("deal_id", params.id).single();
    if (fetchError || !application) return apiError("Application not found", 404);

    const body = await req.json();

    // --- KOL: withdraw own application ---
    if (user.role === "kol") {
      const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
      if (!kolProfile || application.kol_id !== kolProfile.id) return apiError("Forbidden", 403);
      if (body.status !== "withdrawn") return apiError("KOLs can only withdraw their application", 400);
      const { data: updated, error } = await supabase
        .from("applications").update({ status: "withdrawn", updated_at: new Date().toISOString() }).eq("id", params.appId).select().single();
      if (error) return apiError("Failed to withdraw application", 500);
      return apiSuccess({ application: updated });
    }

    // --- Project: accept or reject ---
    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      const { data: deal } = await supabase.from("deals").select("project_id, status").eq("id", params.id).single();
      if (!profile || !deal || deal.project_id !== profile.id) return apiError("Forbidden", 403);
      if (deal.status !== "open") return apiError("Deal is not open for application review", 400);

      const parsed = ReviewApplicationSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

      const { data: updated, error: updateError } = await supabase
        .from("applications")
        .update({ status: parsed.data.status, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", params.appId).select().single();
      if (updateError) return apiError("Failed to update application", 500);

      if (parsed.data.status === "accepted") {
        // Move deal to in_progress
        await supabase.from("deals").update({
          status: "in_progress",
          accepted_kol_id: application.kol_id,
          updated_at: new Date().toISOString(),
        }).eq("id", params.id);

        // Auto-create escrow wallet — generate fresh Solana keypair
        try {
          const escrowKeypair = Keypair.generate();
          const privateKeyB64 = Buffer.from(escrowKeypair.secretKey).toString("base64");
          const encryptedKey = encryptPrivateKey(privateKeyB64);
          const publicKey = escrowKeypair.publicKey.toBase58();

          await supabase.from("escrow_wallets").insert({
            deal_id: params.id,
            public_key: publicKey,
            encrypted_private_key: encryptedKey,
            balance_usdc: 0,
          });
        } catch (escrowErr) {
          // Non-fatal: deal still moves to in_progress, escrow can be created via admin
          console.error("[applications/[appId]] escrow wallet creation failed:", escrowErr);
        }

        sendDealInProgressEmails(params.id).catch(console.error);
      }

      sendApplicationStatusEmail(params.appId, parsed.data.status).catch(console.error);
      return apiSuccess({ application: updated });
    }

    return apiError("Forbidden", 403);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications/[appId] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; appId: string } }) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();
    const { error } = await supabase.from("applications").delete().eq("id", params.appId).eq("deal_id", params.id);
    if (error) return apiError("Failed to delete application", 500);
    return apiSuccess({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications/[appId] DELETE]", res);
    return apiError("Internal server error", 500);
  }
}

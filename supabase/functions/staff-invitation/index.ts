// ==============================================================================
// FIXIA CoachingOS — Supabase Edge Function: staff-invitation
// ==============================================================================
// Handles secure server-side staff invitations and account provisioning.
// Runs in Deno on Supabase Edge runtime.
// Uses SERVICE_ROLE_KEY strictly on the server; NEVER exposed to the frontend.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteStaffPayload {
  action: "invite" | "deactivate";
  instituteId: string;
  email: string;
  fullName?: string;
  role?: "teacher" | "faculty" | "staff" | "admin";
  assignedBatches?: string[];
  userId?: string;
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration missing required environment variables." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Authenticate the caller using their JWT
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid or expired session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Admin client for privileged operations (service_role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload: InviteStaffPayload = await req.json();
    const { action, instituteId, email, fullName, role = "teacher", assignedBatches = [], userId } = payload;

    if (!instituteId) {
      return new Response(JSON.stringify({ error: "instituteId is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verify caller's authority in the target institute
    const { data: callerMembership, error: membershipError } = await supabaseAdmin
      .from("memberships")
      .select("role, is_active")
      .eq("institute_id", instituteId)
      .eq("user_id", callerUser.id)
      .single();

    // Check if caller is platform super admin
    const { data: superAdmin } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", callerUser.id)
      .eq("is_active", true)
      .maybeSingle();

    const isAuthorized = superAdmin || (callerMembership?.is_active && ["owner", "admin"].includes(callerMembership.role));

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only institute owners or administrators can manage staff accounts." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Handle action
    if (action === "invite") {
      if (!email || !fullName) {
        return new Response(JSON.stringify({ error: "email and fullName are required for invitations." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists in auth.users
      let targetUserId: string | null = null;
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          invited_to_institute: instituteId,
          role,
        },
      });

      if (inviteError) {
        // If user already registered, look up their profile ID
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          targetUserId = existingProfile.id;
        } else {
          return new Response(JSON.stringify({ error: inviteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (inviteData?.user) {
        targetUserId = inviteData.user.id;
      }

      // Execute stored procedure to provision membership and audit log
      const { data: provisionedUserId, error: rpcError } = await supabaseAdmin.rpc("create_staff_member", {
        p_institute_id: instituteId,
        p_email: email.toLowerCase(),
        p_full_name: fullName,
        p_role: role,
        p_assigned_batches: assignedBatches,
      });

      if (rpcError) {
        return new Response(JSON.stringify({ error: rpcError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Staff member ${fullName} (${email}) provisioned with role ${role}.`,
          userId: provisionedUserId || targetUserId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "deactivate") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required for deactivation." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: deactivated, error: deactError } = await supabaseAdmin.rpc("deactivate_staff_member", {
        p_institute_id: instituteId,
        p_user_id: userId,
      });

      if (deactError) {
        return new Response(JSON.stringify({ error: deactError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Staff member deactivated successfully.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(JSON.stringify({ error: `Unsupported action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

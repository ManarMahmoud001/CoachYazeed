// Supabase Edge Function: generate-jitsi-jwt
//
// Mints a short-lived JWT for a JaaS (8x8.vc) video call room.
// The private key never reaches the browser — it lives only in this
// function's environment secrets.
//
// Required secrets (set via `supabase secrets set` or the Dashboard):
//   JITSI_APP_ID      -> e.g. vpaas-magic-cookie-xxxxxxxxxxxxxxxx
//   JITSI_KID         -> the API Key ID shown next to your key in the JaaS console
//   JITSI_PRIVATE_KEY -> the full PEM private key content (including
//                        -----BEGIN PRIVATE KEY----- / -----END PRIVATE KEY-----)
//
// SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically by Supabase.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.2.3";

const APP_ID = Deno.env.get("JITSI_APP_ID") ?? "";
const KID = Deno.env.get("JITSI_KID") ?? "";
const PRIVATE_KEY_PEM = Deno.env.get("JITSI_PRIVATE_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const missing = [];
  if (!APP_ID) missing.push("JITSI_APP_ID");
  if (!KID) missing.push("JITSI_KID");
  if (!PRIVATE_KEY_PEM) missing.push("JITSI_PRIVATE_KEY");

  if (missing.length > 0) {
    console.error(`Missing secrets: ${missing.join(", ")}`);
    console.error(
      `Lengths -> APP_ID: ${APP_ID.length}, KID: ${KID.length}, PRIVATE_KEY: ${PRIVATE_KEY_PEM.length}`
    );
    return json({ error: `Server not configured (missing: ${missing.join(", ")})` }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth header" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const user = userData.user;

    const { roomName, callRequestId } = await req.json();
    if (!roomName || typeof roomName !== "string") {
      return json({ error: "roomName is required" }, 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, full_name")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin === true;

    // Non-admins may only get a token for a call that is theirs,
    // currently scheduled, and matches this exact room name.
    if (!isAdmin) {
      if (!callRequestId) {
        return json({ error: "callRequestId is required" }, 400);
      }

      const { data: callRequest, error: callError } = await supabase
        .from("call_requests")
        .select("user_id, room_name, status")
        .eq("id", callRequestId)
        .single();

      if (
        callError ||
        !callRequest ||
        callRequest.user_id !== user.id ||
        callRequest.room_name !== roomName ||
        callRequest.status !== "scheduled"
      ) {
        return json({ error: "Not authorized for this room" }, 403);
      }
    }

    const privateKey = await importPKCS8(PRIVATE_KEY_PEM, "RS256");
    const now = Math.floor(Date.now() / 1000);

    const jwt = await new SignJWT({
      context: {
        user: {
          name: profile?.full_name || user.email || "Guest",
          email: user.email || "",
          moderator: isAdmin,
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          "outbound-call": false,
        },
      },
      room: roomName,
    })
      .setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" })
      .setIssuer("chat")
      .setAudience("jitsi")
      .setSubject(APP_ID)
      .setIssuedAt(now)
      .setNotBefore(now - 10)
      .setExpirationTime(now + 60 * 60 * 2) // 2 hours
      .sign(privateKey);

    return json({ jwt, appId: APP_ID });
  } catch (err) {
    console.error("generate-jitsi-jwt error:", err);
    return json({ error: "Internal error" }, 500);
  }
});

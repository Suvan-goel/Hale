import { createClient } from "@supabase/supabase-js";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function serverSecret(): string {
  // Hosted projects expose new named secret keys as JSON. Keep the legacy
  // fallback only for projects that have not completed the key migration.
  const namedSecrets = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (namedSecrets) {
    try {
      const parsed = JSON.parse(namedSecrets) as Record<string, unknown>;
      if (typeof parsed.default === "string" && parsed.default.length > 0) {
        return parsed.default;
      }
    } catch {
      // Fall through to the single-key environment variables below.
    }
  }

  const secret = Deno.env.get("SUPABASE_SECRET_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!secret) throw new Error("Supabase server secret is not configured");
  return secret;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const jwt = bearerToken(request);
  if (!jwt) return json(401, { error: "unauthorized" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");

    const admin = createClient(supabaseUrl, serverSecret(), {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    // getUser(jwt) validates the token with Supabase Auth. The function never
    // reads a request body, so a caller cannot nominate another account.
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(jwt);

    if (userError || !user) return json(401, { error: "unauthorized" });

    // Database rows are deleted by auth.users foreign keys with ON DELETE
    // CASCADE. This keeps privileged deletion logic out of application code.
    const { error: deletionError } = await admin.auth.admin.deleteUser(
      user.id,
      false,
    );
    if (deletionError) {
      console.error(
        "[delete-account] Auth deletion failed",
        deletionError.code,
      );
      return json(500, { error: "account_deletion_failed" });
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error(
      "[delete-account] Server configuration or request failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return json(500, { error: "account_deletion_failed" });
  }
});

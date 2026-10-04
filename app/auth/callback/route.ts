import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/reset-password";

    // Strictly validate 'next' to prevent open redirect vulnerabilities
    // Must be a relative path starting with a single '/'
    const isRelative = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\");
    const safeNext = isRelative ? next : "/reset-password";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
        }
    }

    // Return to login with error query parameter if code is missing or exchange fails
    return NextResponse.redirect(
        new URL(
            "/login?error=" +
                encodeURIComponent("Invalid or expired password reset link. Please request a new one."),
            requestUrl.origin
        )
    );
}

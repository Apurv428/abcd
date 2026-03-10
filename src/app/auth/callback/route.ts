import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    // Use the actual site URL, not the internal origin (which might be localhost)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (origin.includes('localhost') 
                        ? 'https://5170efd5-d913-4d8a-ace0-4282be6d0ba9.preview.emergentagent.com' 
                        : origin);

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // ignore
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${siteUrl}${next}`);
        }
    }

    return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`);
}

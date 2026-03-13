import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* ignore */ }
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: products, error } = await supabase
      .from("shelf_products").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ products: products || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, brand, category, opened_date, pao_months, notes } = body;

    if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });

    let expiry_date = null;
    if (opened_date && pao_months) {
      const d = new Date(opened_date);
      d.setMonth(d.getMonth() + parseInt(pao_months));
      expiry_date = d.toISOString().split("T")[0];
    }

    const { data, error } = await supabase.from("shelf_products").insert({
      user_id: user.id, name, brand: brand || null, category: category || null,
      opened_date: opened_date || null, pao_months: pao_months ? parseInt(pao_months) : null,
      expiry_date, notes: notes || null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

    const { error } = await supabase.from("shelf_products").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

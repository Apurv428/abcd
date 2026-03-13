import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { weather, previousCity, timeContext } = body;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ nudges: [] });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const isTransition = previousCity && previousCity !== weather.city && previousCity !== "Your Location";
    
    const prompt = `You are a helpful, witty, and professional clinical dermatologist AI.
Generate 1-3 short, personalized skincare "nudges" (max 15 words each) based on the user's current environmental context.

CONTEXT:
- Current Location: ${weather.city}
- Previous Location: ${previousCity || 'Unknown'}
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%
- UV Index: ${weather.uvIndex}
- Local Time: ${timeContext}
- Is Location Transition: ${isTransition ? 'YES' : 'NO'}

REQUIREMENTS:
- If location transitioned (e.g. Mumbai to Ladakh), acknowledge the climate shift (e.g. "Welcome to dry Ladakh! Double your moisturizer today.").
- If time is around NOON (11am-2pm), warning about high sun intensity.
- If UV index is HIGH (>6), emphasize SPF reapplication.
- If Humidity is LOW (<30%), suggest hydrating layers.
- Tone: Premium, caring, concise.
- Use 1 relevant emoji per nudge.

Return ONLY valid JSON with no markdown:
{
  "nudges": [
    { "id": "nudge-1", "message": "...", "type": "location" | "time" | "weather", "severity": "low" | "medium" | "high" }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Nudges API error:", err);
    return NextResponse.json({ nudges: [] });
  }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getWeatherByCoords, getWeatherData } from "@/lib/weather";

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

    const body = await request.json().catch(() => ({}));
    const { lat, lon } = body;

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("skin_type, concerns, city, sensitivity_level").eq("id", user.id).single();
    const skinType = profile?.skin_type || "combination";
    const concerns = profile?.concerns || ["general skincare"];
    const profileCity = profile?.city || "";

    // Get weather
    let weather;
    if (lat && lon) {
      weather = await getWeatherByCoords(lat, lon);
    } else if (profileCity) {
      weather = await getWeatherData(profileCity);
    } else {
      weather = { temperature: 25, humidity: 55, uvIndex: 5, description: "Clear", city: "Your Location" };
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    let morning, evening;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let conditionalInstructions = "";
        if (weather.uvIndex >= 6) conditionalInstructions += "\nCRITICAL: Make SPF 50+ the main focus of morning routine. Mention reapplication every 2 hours.";
        if (weather.humidity < 30) conditionalInstructions += "\nCRITICAL: Low humidity — add hydrating toner and serum layers. Recommend humidifier at night.";
        if (weather.humidity > 80) conditionalInstructions += "\nHigh humidity — recommend lightweight non-comedogenic products.";

        const prompt = `You are a dermatologist AI creating a daily skincare routine.

Patient profile:
- Skin Type: ${skinType}
- Concerns: ${concerns.join(", ")}
- Sensitivity Level: ${profile?.sensitivity_level || 3}/5
- Location: ${weather.city}
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%
- UV Index: ${weather.uvIndex}
- Conditions: ${weather.description}
${conditionalInstructions}

Return ONLY valid JSON with no markdown:
{
  "morning": {
    "steps": [
      { "order": 1, "name": "Step Name", "icon": "emoji", "description": "Detailed instruction", "duration": "30 sec" }
    ]
  },
  "evening": {
    "steps": [
      { "order": 1, "name": "Step Name", "icon": "emoji", "description": "Detailed instruction", "duration": "1 min" }
    ]
  }
}

Create 5-7 steps for each routine. Be specific to the patient's skin type and current weather.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        morning = parsed.morning;
        evening = parsed.evening;
      } catch (err: unknown) {
        console.error("Routine Gemini error:", err instanceof Error ? err.message : err);
        const mock = getMockRoutine(skinType, weather.uvIndex);
        morning = mock.morning;
        evening = mock.evening;
      }
    } else {
      const mock = getMockRoutine(skinType, weather.uvIndex);
      morning = mock.morning;
      evening = mock.evening;
    }

    // Save routines
    await Promise.all([
      supabase.from("routines").insert({ user_id: user.id, type: "morning", steps_json: morning, weather_context_json: weather }),
      supabase.from("routines").insert({ user_id: user.id, type: "evening", steps_json: evening, weather_context_json: weather }),
    ]);

    return NextResponse.json({ morning, evening, weather });
  } catch (err: unknown) {
    console.error("Routine error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to generate routine" }, { status: 500 });
  }
}

function getMockRoutine(skinType: string, uvIndex: number) {
  return {
    morning: {
      steps: [
        { order: 1, name: "Gentle Cleanser", icon: "🧴", description: `Use a gentle ${skinType === "oily" ? "foaming" : "cream"} cleanser with lukewarm water for 60 seconds.`, duration: "1 min" },
        { order: 2, name: "Toner", icon: "💧", description: "Apply an alcohol-free hydrating toner to balance skin pH.", duration: "30 sec" },
        { order: 3, name: "Serum", icon: "✨", description: "Apply vitamin C serum for antioxidant protection and brightening.", duration: "30 sec" },
        { order: 4, name: "Moisturizer", icon: "🧊", description: `Apply a ${skinType === "oily" ? "gel-based lightweight" : "rich hydrating"} moisturizer.`, duration: "30 sec" },
        { order: 5, name: "Sunscreen", icon: "☀️", description: `Apply SPF ${uvIndex >= 6 ? "50+" : "30+"} broad-spectrum sunscreen. ${uvIndex >= 6 ? "Reapply every 2 hours if outdoors." : ""}`, duration: "30 sec" },
      ],
    },
    evening: {
      steps: [
        { order: 1, name: "Oil Cleanser", icon: "🫧", description: "Start with an oil-based cleanser to dissolve makeup and sunscreen.", duration: "1 min" },
        { order: 2, name: "Water Cleanser", icon: "🧴", description: "Follow with a gentle water-based cleanser for thorough cleansing.", duration: "1 min" },
        { order: 3, name: "Exfoliant", icon: "🔬", description: "Use a gentle chemical exfoliant (BHA/AHA) 2-3 times per week.", duration: "30 sec" },
        { order: 4, name: "Treatment Serum", icon: "💜", description: "Apply retinol or niacinamide serum for overnight repair.", duration: "30 sec" },
        { order: 5, name: "Eye Cream", icon: "👁️", description: "Gently pat eye cream around the orbital bone.", duration: "30 sec" },
        { order: 6, name: "Night Moisturizer", icon: "🌙", description: "Seal everything with a nourishing night cream.", duration: "30 sec" },
      ],
    },
  };
}

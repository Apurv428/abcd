import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getWeatherData, getWeatherByCoords } from "@/lib/weather";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse body for coordinates
        let coords: { lat: number; lon: number } | null = null;
        try {
            const body = await req.json();
            if (body.lat && body.lon) {
                coords = { lat: body.lat, lon: body.lon };
            }
        } catch {
            // No body or invalid JSON is fine
        }

        // 1. Fetch user profile for location/skin type
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        // 2. Fetch latest skin analysis
        const { data: latestAnalysis } = await supabase
            .from("skin_analyses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        // 3. Fetch weather - prioritize coordinates if provided
        let weather;
        if (coords) {
            weather = await getWeatherByCoords(coords.lat, coords.lon);
        } else {
            weather = await getWeatherData(profile?.location || "New York");
        }

        // 4. Generate routine using Gemini
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        if (!apiKey || apiKey === "your_gemini_api_key") {
            // Mock routine generator if no API key
            const mockRoutine = generateMockRoutine(weather, profile?.skin_type);
            return NextResponse.json({
                morning: { steps: mockRoutine.morning },
                evening: { steps: mockRoutine.evening },
                weather,
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-05-06" });

        const prompt = `You are an expert dermatologist creating a personalized skincare routine. Generate a routine for a user with:

Skin Type: ${profile?.skin_type || latestAnalysis?.analysis_json?.skinType || "normal"}
Concerns: ${profile?.concerns?.join(", ") || latestAnalysis?.analysis_json?.concerns?.join(", ") || "general skincare"}
Latest Analysis: ${JSON.stringify(latestAnalysis?.analysis_json || {})}

Current Weather in ${weather.city}:
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%
- UV Index: ${weather.uvIndex} ${weather.uvIndex >= 6 ? "(HIGH - emphasize sun protection!)" : ""}
- Conditions: ${weather.description}

${weather.humidity < 30 ? "IMPORTANT: Low humidity detected - recommend hydrating products!" : ""}
${weather.uvIndex >= 6 ? "IMPORTANT: High UV - emphasize SPF 50+ and reapplication!" : ""}

Return ONLY a JSON object with this exact structure:
{
    "morning": [
        {"order": 1, "name": "Step Name", "icon": "emoji", "description": "Why and how to use", "duration": "X min"}
    ],
    "evening": [
        {"order": 1, "name": "Step Name", "icon": "emoji", "description": "Why and how to use", "duration": "X min"}
    ]
}

Create 4-5 steps per routine. Use relevant emojis for icons (🧴💧🌸☀️🌙✨). Make descriptions personalized to their skin type and current weather conditions.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const routine = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

        // Save routine to database
        await supabase.from("routines").insert([
            { user_id: user.id, type: "morning", steps_json: routine.morning, weather_context_json: weather },
            { user_id: user.id, type: "evening", steps_json: routine.evening, weather_context_json: weather },
        ]);

        return NextResponse.json({
            morning: { steps: routine.morning },
            evening: { steps: routine.evening },
            weather,
        });
    } catch (error: any) {
        console.error("Routine Generation Error:", error);

        // Return fallback routine
        const fallbackRoutine = generateMockRoutine({ temperature: 25, humidity: 50, uvIndex: 5, description: "Clear", city: "Your City" }, "normal");
        return NextResponse.json({
            morning: { steps: fallbackRoutine.morning },
            evening: { steps: fallbackRoutine.evening },
            weather: { temperature: 25, humidity: 50, uvIndex: 5, description: "Clear", city: "Your City" },
        });
    }
}

function generateMockRoutine(weather: any, skinType?: string) {
    const morning = [
        { order: 1, name: "Cleanse", icon: "🧴", description: "Use a gentle cleanser to remove overnight oils without stripping your skin.", duration: "1 min" },
        { order: 2, name: "Tone", icon: "💧", description: "Apply a hydrating toner to balance pH and prep skin for serums.", duration: "30 sec" },
        { order: 3, name: "Serum", icon: "✨", description: skinType === "dry" ? "Apply a hyaluronic acid serum for deep hydration." : "Apply a niacinamide serum to control oil and minimize pores.", duration: "1 min" },
        { order: 4, name: "Moisturize", icon: "🌸", description: weather.humidity < 40 ? "Use a rich moisturizer - humidity is low today!" : "Apply a lightweight moisturizer.", duration: "1 min" },
        { order: 5, name: "Sunscreen", icon: "☀️", description: weather.uvIndex >= 6 ? `UV index is ${weather.uvIndex} - Apply SPF 50+ generously and reapply every 2 hours!` : "Apply SPF 30+ to protect from UV damage.", duration: "1 min" },
    ];

    const evening = [
        { order: 1, name: "Oil Cleanse", icon: "🫧", description: "Remove sunscreen and makeup with an oil-based cleanser.", duration: "1 min" },
        { order: 2, name: "Water Cleanse", icon: "🧴", description: "Follow up with a gentle water-based cleanser for a deep clean.", duration: "1 min" },
        { order: 3, name: "Treatment", icon: "💫", description: skinType === "oily" ? "Apply a BHA serum to unclog pores." : "Apply retinol for anti-aging benefits (skip if sensitive).", duration: "1 min" },
        { order: 4, name: "Eye Cream", icon: "👁️", description: "Gently pat eye cream around the orbital bone.", duration: "30 sec" },
        { order: 5, name: "Night Cream", icon: "🌙", description: weather.humidity < 30 ? "Use a heavy night cream - low humidity requires extra moisture!" : "Apply a nourishing night cream to repair skin overnight.", duration: "1 min" },
    ];

    return { morning, evening };
}

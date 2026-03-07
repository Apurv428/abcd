import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getWeatherData } from "@/lib/weather";

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // 3. Fetch weather for location
        const weather = await getWeatherData(profile?.location || "New York");

        // 4. Generate routine using Gemini
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        if (!apiKey || apiKey === "your_gemini_api_key") {
            // Mock routine generator if no API key
            const mockRoutine = {
                morning: [
                    { step: "Cleanse", product: "Gentle Foaming Cleanser", description: "Remove overnight oils without stripping." },
                    { step: "Hydrate", product: "Hyaluronic Acid Serum", description: "Apply to damp skin for maximum absorption." },
                    { step: "Protect", product: "SPF 50+ Sunscreen", description: `Important today as UV index is ${weather.uvIndex}.` }
                ],
                evening: [
                    { step: "Double Cleanse", product: "Cleansing Balm + Water-based Cleanser", description: "Remove sunscreen and pollutants." },
                    { step: "Treat", product: "Retinol 0.5%", description: "Apply a pea-sized amount to dry skin." },
                    { step: "Repair", product: "Ceramide Moisturizer", description: "Lock in moisture and repair skin barrier." }
                ]
            };
            return NextResponse.json(mockRoutine);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Generate a skincare routine for a user with the following context:
    Skin Type: ${profile?.skin_type || "normal"}
    Concerns: ${profile?.concerns?.join(", ") || "none specified"}
    Latest Analysis: ${JSON.stringify(latestAnalysis?.analysis_json || {})}
    Weather today: Temp ${weather.temperature}°C, Humidity ${weather.humidity}%, UV Index ${weather.uvIndex}
    
    Return a JSON object with:
    morning (array of {step, product, description})
    evening (array of {step, product, description})
    Keep it concise and practical. Include weather-specific advice (e.g., more SPF if high UV).`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const routine = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

        return NextResponse.json(routine);
    } catch (error: any) {
        console.error("Routine Generation Error:", error);

        // Check if it's a rate limit error
        if (error.message?.includes("429") || error.status === 429) {
            console.warn("Gemini Quota Exceeded for routine. Falling back to mock data.");
            return NextResponse.json({
                morning: [
                    { step: "Cleanse", product: "Gentle Cleanser", description: "Standard morning cleanse (Quota fallback)." },
                    { step: "Moisturize", product: "Daily Moisturizer", description: "Keep skin hydrated throughout the day." },
                    { step: "Protect", product: "Broad Spectrum SPF 30", description: "Essential protection from UV rays." }
                ],
                evening: [
                    { step: "Cleanse", product: "Gentle Cleanser", description: "Standard evening cleanse (Quota fallback)." },
                    { step: "Treat", product: "Hydrating Serum", description: "Repair skin overnight." },
                    { step: "Seal", product: "Night Cream", description: "Deep hydration before sleep." }
                ]
            });
        }

        // Return a basic fallback routine on error instead of 500
        return NextResponse.json({
            morning: [{ step: "Cleanse", product: "Gentle Cleanser", description: "Start your day fresh." }],
            evening: [{ step: "Cleanse", product: "Gentle Cleanser", description: "End your day clean." }]
        });
    }
}

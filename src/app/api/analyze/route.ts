import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("Auth: No user found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { image } = body;

        if (!image) {
            console.error("Input: No image provided");
            return NextResponse.json({ error: "Missing image data" }, { status: 400 });
        }

        console.log("Analyzing image, base64 length:", image.length);

        // Initialize Gemini
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        // MOCK FALLBACK if no API key
        if (!apiKey || apiKey === "your_gemini_api_key") {
            console.log("Using mock Gemini analysis (no API key)");
            const mockResult = {
                skinType: "combination",
                skinScore: 82,
                concerns: ["slight dehydration", "enlarged pores in T-zone"],
                recommendations: ["Focus on hydrating serums", "Use a gentle BHA exfoliant twice a week"],
                summary: "Your skin looks healthy overall (MOCK MODE)."
            };

            const { data: dbData, error: dbError } = await supabase
                .from("skin_analyses")
                .insert({
                    user_id: user.id,
                    image_url: image.substring(0, 100) + "...", // Don't log/store huge URL if possible
                    analysis_json: mockResult,
                    skin_score: mockResult.skinScore
                })
                .select()
                .single();

            if (dbError) {
                console.error("Database Error (Mock):", dbError);
                throw dbError;
            }
            return NextResponse.json({ analysis: dbData.analysis_json });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const base64Data = image.split(",")[1];
        if (!base64Data) throw new Error("Invalid image format");

        const prompt = `Analyze this skin photo and return a JSON object with: 
        skin_type (one of: oily, dry, combination, normal, sensitive), 
        skin_score (0-100), 
        concerns (array of strings), 
        recommendations (array of strings), 
        summary (string).`;

        console.log("Calling Gemini API...");
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Gemini Raw Response:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

        const formattedResult = {
            skinType: analysisResult.skin_type || analysisResult.skinType || "normal",
            skinScore: analysisResult.skin_score || analysisResult.skinScore || 70,
            concerns: Array.isArray(analysisResult.concerns) ? analysisResult.concerns : [],
            summary: analysisResult.summary || "",
            recommendations: Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations : [analysisResult.recommendations].filter(Boolean)
        };

        console.log("Saving to Supabase...");
        const { data: dbData, error: dbError } = await supabase
            .from("skin_analyses")
            .insert({
                user_id: user.id,
                image_url: "stored-in-analysis-json", // Avoid huge text column if possible
                analysis_json: formattedResult,
                skin_score: formattedResult.skinScore
            })
            .select()
            .single();

        if (dbError) {
            console.error("Database Error:", dbError);
            throw dbError;
        }

        console.log("Analysis complete!");
        return NextResponse.json({ analysis: dbData.analysis_json });

    } catch (error: any) {
        console.error("Critical Analysis Error:", error);

        if (error.message?.includes("429") || error.status === 429) {
            console.warn("Quota Exceeded - Returning Mock Data");
            const mockResult = {
                skinType: "combination",
                skinScore: 82,
                concerns: ["slight dehydration", "enlarged pores in T-zone"],
                recommendations: ["Focus on hydrating serums", "Use a gentle BHA exfoliant twice a week"],
                summary: "Your skin looks healthy overall (MOCK DATA - Quota Exceeded)."
            };
            return NextResponse.json({ analysis: mockResult });
        }

        return NextResponse.json({ error: error.message || "Unknown error occurred" }, { status: 500 });
    }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DERMATOLOGY_PROMPT = `You are a board-certified dermatologist AI with expertise in clinical dermatoscopy and skin analysis. Analyze this skin photograph with clinical precision.

IMPORTANT INSTRUCTIONS:
- Analyze only what is visible in the image
- Be specific and clinical in your findings
- If image quality is poor, note it in the summary
- Flag anything that warrants professional consultation
- Return ONLY valid JSON with no markdown, no explanation, no preamble

Return exactly this JSON structure:

{
  "skinScore": <integer 0-100, overall skin health>,
  "skinType": <"oily" | "dry" | "combination" | "normal" | "sensitive">,

  "fitzpatrickScale": <integer 1-6>,
  "fitzpatrickDescription": <"Type I: Very fair, always burns" | "Type II: Fair, usually burns" | "Type III: Medium, sometimes burns" | "Type IV: Olive, rarely burns" | "Type V: Brown, very rarely burns" | "Type VI: Dark, never burns">,

  "acne": {
    "present": <boolean>,
    "severity": <"none" | "mild" | "moderate" | "severe" | "very_severe">,
    "severityScore": <integer 0-4, IGA scale: 0=clear, 1=almost clear, 2=mild, 3=moderate, 4=severe>,
    "types": <array of: "blackheads" | "whiteheads" | "papules" | "pustules" | "nodules" | "cysts">,
    "primaryZones": <array of: "forehead" | "nose" | "chin" | "cheeks" | "jawline" | "temples">
  },

  "pigmentation": {
    "present": <boolean>,
    "type": <"none" | "PIH" | "PIE" | "melasma" | "sun_spots" | "freckles" | "mixed">,
    "distribution": <"localized" | "diffuse" | "none">,
    "severity": <"none" | "mild" | "moderate" | "severe">
  },

  "texture": {
    "smoothnessScore": <integer 0-100, 100=very smooth>,
    "poreVisibility": <"minimal" | "moderate" | "enlarged" | "very_enlarged">,
    "issues": <array of: "rough_texture" | "bumpy" | "uneven" | "peeling" | "flaking" | "fine_lines" | "deep_wrinkles" | "acne_scars" | "ice_pick_scars" | "rolling_scars" | "boxcar_scars">
  },

  "hydration": {
    "level": <"severely_dehydrated" | "dehydrated" | "normal" | "well_hydrated">,
    "score": <integer 0-100>,
    "signs": <array of: "tight_feeling" | "flaking" | "dullness" | "fine_dehydration_lines" | "none">
  },

  "oiliness": {
    "level": <"none" | "low" | "moderate" | "high" | "very_high">,
    "zones": <array of: "T-zone" | "forehead" | "nose" | "chin" | "cheeks" | "full_face" | "none">
  },

  "redness": {
    "present": <boolean>,
    "type": <"none" | "rosacea_suspect" | "general_inflammation" | "post_acne" | "irritation">,
    "severity": <"none" | "mild" | "moderate" | "severe">
  },

  "aging": {
    "visibleAgeMarkers": <array of: "none" | "fine_lines" | "deep_wrinkles" | "loss_of_firmness" | "hollowing" | "age_spots">,
    "perceivedSkinAge": <integer, estimated skin age in years>
  },

  "urgentFlag": <boolean, true ONLY if: suspicious moles with irregular borders/asymmetry/multiple colors, rapidly changing lesions, or anything requiring immediate dermatologist evaluation>,
  "urgentReason": <string describing the urgent finding, or null>,

  "concerns": <string array, 2-6 specific clinical concerns found, in order of severity>,
  "recommendations": <string array, 5-8 specific actionable recommendations tailored to findings>,
  "summary": <string, 3-4 sentence clinical assessment including key findings and overall skin health evaluation>,
  "imageQuality": <"good" | "fair" | "poor">,
  "imageQualityNote": <string, note about lighting/blur/angle issues if quality is fair or poor, otherwise null>
}`;

const SIMPLIFIED_PROMPT = `You are a clinical dermatologist AI. Analyze this skin photo and return ONLY valid JSON with these exact fields. Use null for unknown values.

{
  "skinScore": <integer 0-100>,
  "skinType": "oily"|"dry"|"combination"|"normal"|"sensitive",
  "fitzpatrickScale": <integer 1-6>,
  "fitzpatrickDescription": <string>,
  "acne": { "present": <boolean>, "severity": <string>, "severityScore": <0-4>, "types": [], "primaryZones": [] },
  "pigmentation": { "present": <boolean>, "type": <string>, "distribution": <string>, "severity": <string> },
  "texture": { "smoothnessScore": <0-100>, "poreVisibility": <string>, "issues": [] },
  "hydration": { "level": <string>, "score": <0-100>, "signs": [] },
  "oiliness": { "level": <string>, "zones": [] },
  "redness": { "present": <boolean>, "type": <string>, "severity": <string> },
  "aging": { "visibleAgeMarkers": [], "perceivedSkinAge": <integer> },
  "urgentFlag": <boolean>,
  "urgentReason": null,
  "concerns": [],
  "recommendations": [],
  "summary": <string>,
  "imageQuality": "good",
  "imageQualityNote": null
}`;

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
    const { image: imageData, category = "face" } = body;
    if (!imageData) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    let analysis;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = imageData.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";

        let prompt = `You are a clinical dermatologist AI. Analyze this photograph. Return ONLY valid JSON with NO markdown, no backticks, no explanation.`;
        
        if (category === "hair") {
          prompt += `
CATEGORY: Hair & Beard
Analyze for: hair density, scalp health, patches (alopecia/beard patches), follicle strength, and thinning patterns.
JSON response structure:
{
  "skinType": "N/A",
  "skinScore": integer 0-100 (Hair/Beard health score),
  "concerns": string[] (2-4 hair/scalp specific concerns),
  "recommendations": string[] (3-5 actionable hair/beard care steps),
  "summary": string (2-3 sentence clinical summary of hair health),
  "urgentFlag": boolean
}`;
        } else if (category === "body") {
          prompt += `
CATEGORY: Body Skin
Analyze for: dark patches, dryness, irritation, texture, lesions, or moles on limbs/torso.
JSON response structure:
{
  "skinType": "dry"|"normal"|"irritated"|"sun-damaged",
  "skinScore": integer 0-100 (Area health score),
  "concerns": string[] (2-4 specific skin concerns detected),
  "recommendations": string[] (3-5 actionable body skincare steps),
  "summary": string (2-3 sentence clinical summary of the area),
  "urgentFlag": boolean
}`;
        } else {
          prompt += `
CATEGORY: Facial Skin
Analyze for: type, texture, scores, acne, aging, and hydration.
JSON response structure:
{
  "skinType": "oily"|"dry"|"combination"|"normal"|"sensitive",
  "skinScore": integer 0-100,
  "concerns": string[] (2-5 concerns),
  "recommendations": string[] (4-6 steps),
  "summary": string (2-3 sentences),
  "urgentFlag": boolean
}`;
        }

        const result = await model.generateContent([
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ]);

        const responseText = result.response.text();
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        analysis = JSON.parse(cleaned);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("429") || message.includes("quota")) {
          analysis = getMockAnalysis("Rate limit reached — showing sample results", category);
        } else {
          console.error("Gemini error:", message);
          analysis = getMockAnalysis("AI temporarily unavailable — showing sample results", category);
        }
      }
    } else {
      analysis = getMockAnalysis("Demo mode — no API key configured", category);
    }

    // 4. Upload to Supabase Storage if AI succeeded
    let imageUrl = null;
    if (analysis && imageData) {
      console.log("Attempting storage upload. Image data length:", imageData.length);
      try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Use a flatter filename to avoid folder permission issues during debug
        const fileName = `analysis_${user.id}_${Date.now()}.jpg`;
        console.log("Uploading to bucket 'analysis-images' with filename:", fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("analysis-images")
          .upload(fileName, bytes, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error("Storage upload error detailed:", uploadError);
        } else if (uploadData) {
          console.log("Upload successful. Path:", uploadData.path);
          const { data } = supabase.storage
            .from("analysis-images")
            .getPublicUrl(uploadData.path);
          imageUrl = data.publicUrl;
          console.log("Generated public URL:", imageUrl);
        }
      } catch (storageErr) {
        console.error("Critical storage processing error:", storageErr);
      }
    }

    // 5. Save to DB with category and imageUrl
    const { data: savedRecord, error: dbError } = await supabase.from("skin_analyses").insert({
      user_id: user.id,
      image_url: imageUrl,
      analysis_json: { ...analysis, category },
      skin_score: analysis.skinScore,
      urgent_flag: analysis.urgentFlag || false,
    }).select().single();

    if (dbError) {
      console.error("DB Save error:", dbError.message);
    }

    return NextResponse.json({ 
      analysis: { ...analysis, id: savedRecord?.id }, 
      imageUrl 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred";
    console.error("Analyze route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getMockAnalysis(note: string, category: string) {
  if (category === "hair") {
    return {
      skinType: "N/A",
      skinScore: 68,
      concerns: ["Thinning at temples", "Dry scalp patches"],
      recommendations: ["Use a caffeine-infused scalp serum", "Switch to a sulfate-free strengthening shampoo", "Minimize heat styling"],
      summary: `${note}. Your hair shows early signs of thinning at the temples with some scalp dryness. Overall hair health is fair.`,
      urgentFlag: false,
    };
  }
  if (category === "body") {
    return {
      skinType: "dry",
      skinScore: 62,
      concerns: ["Dry patches on elbows", "Mild hyperpigmentation on forearms"],
      recommendations: ["Apply urea-based cream twice daily", "Use a chemical exfoliant (AHA) once a week", "Always wear SPF on exposed limbs"],
      summary: `${note}. The area shows significant dryness and some uneven tone. Regular hydration and targeted exfoliation will help.`,
      urgentFlag: false,
    };
  }
  return {
    skinType: "combination",
    skinScore: 72,
    concerns: ["Mild dehydration around cheeks", "Minor texture irregularities on forehead", "Slight oil overproduction in T-zone"],
    recommendations: [
      "Use a gentle hydrating cleanser twice daily",
      "Apply hyaluronic acid serum on damp skin",
      "Use SPF 30+ broad-spectrum sunscreen every morning",
      "Add niacinamide serum to address oil balance and texture",
      "Consider a weekly hydrating sheet mask",
    ],
    summary: `${note}. Your skin shows a combination pattern with mild dehydration and slight oiliness in the T-zone. Overall skin health is good with minor areas for improvement.`,
    urgentFlag: false,
  };
}

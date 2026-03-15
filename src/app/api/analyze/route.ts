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

        let prompt = DERMATOLOGY_PROMPT;
        
        if (category === "hair") {
          prompt = `You are a clinical dermatologist AI. Analyze this hair/beard photograph. Return ONLY valid JSON with no markdown, no explanation.
{
  "skinType": "N/A",
  "skinScore": integer 0-100,
  "concerns": string array,
  "recommendations": string array,
  "summary": string,
  "urgentFlag": boolean
}`;
        } else if (category === "body") {
          prompt = `You are a clinical dermatologist AI. Analyze this body skin photograph. Return ONLY valid JSON with no markdown, no explanation.
{
  "skinType": "dry"|"normal"|"irritated"|"sun-damaged",
  "skinScore": integer 0-100,
  "concerns": string array,
  "recommendations": string array,
  "summary": string,
  "urgentFlag": boolean
}`;
        }

        let result;
        try {
          result = await model.generateContent([
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ]);

          const responseText = result.response.text();
          const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          analysis = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error("First parse failed, retrying with simplified prompt:", parseErr instanceof Error ? parseErr.message : "");
          const retryResult = await model.generateContent([
            { text: SIMPLIFIED_PROMPT },
            { inlineData: { mimeType, data: base64Data } },
          ]);
          const retryText = retryResult.response.text();
          const retryCleaned = retryText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          analysis = JSON.parse(retryCleaned);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("429") || message.includes("quota")) {
          analysis = getMockAnalysis("Rate limit reached — showing sample results", category);
          (analysis as any).mock = true;
        } else {
          console.error("Gemini error:", message);
          analysis = getMockAnalysis("AI temporarily unavailable — showing sample results", category);
          (analysis as any).mock = true;
        }
      }
    } else {
      analysis = getMockAnalysis("Demo mode — no API key configured", category);
      (analysis as any).mock = true;
    }

    // 4. Save to DB with category - ID will be generated by Supabase
    const { data: savedRecord, error: dbError } = await supabase.from("skin_analyses").insert({
      user_id: user.id,
      image_url: null, // Will be updated after storage upload
      analysis_json: { ...analysis, category },
      skin_score: analysis.skinScore,
      urgent_flag: analysis.urgentFlag || false,
    }).select().single();

    // 5. Upload image to storage (after we have the analysis ID)
    let imagePath = null;
    if (savedRecord?.id && imageData) {
      try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Store as {user_id}/{analysis_id}.jpg
        const filePath = `${user.id}/${savedRecord.id}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("skin-analyses")
          .upload(filePath, bytes, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          imagePath = uploadData.path;
          // Update DB with the storage path
          await supabase.from("skin_analyses").update({ image_url: imagePath }).eq("id", savedRecord.id);
        }
      } catch (storageErr) {
        console.error("Storage error:", storageErr);
      }
    }

    if (dbError) {
      console.error("DB Save error:", dbError.message);
    }

    return NextResponse.json({ 
      analysis: { ...analysis, id: savedRecord?.id }, 
      imageUrl: imagePath
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
      fitzpatrickScale: 3,
      fitzpatrickDescription: "Type III: Medium, sometimes burns",
      acne: { present: false, severity: "none", severityScore: 0, types: [], primaryZones: [] },
      pigmentation: { present: false, type: "none", distribution: "none", severity: "none" },
      texture: { smoothnessScore: 75, poreVisibility: "moderate", issues: [] },
      hydration: { level: "normal", score: 70, signs: ["none"] },
      oiliness: { level: "moderate", zones: ["T-zone"] },
      redness: { present: false, type: "none", severity: "none" },
      aging: { visibleAgeMarkers: [], perceivedSkinAge: 30 },
      concerns: ["Thinning at temples", "Dry scalp patches"],
      recommendations: ["Use a caffeine-infused scalp serum", "Switch to a sulfate-free strengthening shampoo", "Minimize heat styling", "Consider topical minoxidil", "Massage scalp daily to stimulate circulation"],
      summary: `${note}. Your hair shows early signs of thinning at the temples with some scalp dryness. Overall hair health is fair.`,
      urgentFlag: false,
      urgentReason: null,
      imageQuality: "good",
      imageQualityNote: null,
    };
  }
  if (category === "body") {
    return {
      skinType: "dry",
      skinScore: 62,
      fitzpatrickScale: 3,
      fitzpatrickDescription: "Type III: Medium, sometimes burns",
      acne: { present: false, severity: "none", severityScore: 0, types: [], primaryZones: [] },
      pigmentation: { present: true, type: "sun_spots", distribution: "localized", severity: "mild" },
      texture: { smoothnessScore: 55, poreVisibility: "minimal", issues: ["rough_texture", "flaking"] },
      hydration: { level: "dehydrated", score: 35, signs: ["tight_feeling", "flaking"] },
      oiliness: { level: "none", zones: ["none"] },
      redness: { present: false, type: "none", severity: "none" },
      aging: { visibleAgeMarkers: ["age_spots"], perceivedSkinAge: 42 },
      concerns: ["Dry patches on elbows", "Mild hyperpigmentation on forearms"],
      recommendations: ["Apply urea-based cream twice daily", "Use a chemical exfoliant (AHA) once a week", "Always wear SPF on exposed limbs", "Use a rich body butter after showering", "Consider a humidifier for bedroom"],
      summary: `${note}. The area shows significant dryness and some uneven tone. Regular hydration and targeted exfoliation will help.`,
      urgentFlag: false,
      urgentReason: null,
      imageQuality: "good",
      imageQualityNote: null,
    };
  }
  return {
    skinType: "combination",
    skinScore: 72,
    fitzpatrickScale: 3,
    fitzpatrickDescription: "Type III: Medium, sometimes burns",
    acne: { present: true, severity: "mild", severityScore: 1, types: ["whiteheads"], primaryZones: ["forehead", "nose"] },
    pigmentation: { present: true, type: "PIH", distribution: "localized", severity: "mild" },
    texture: { smoothnessScore: 78, poreVisibility: "moderate", issues: ["large_pores"] },
    hydration: { level: "dehydrated", score: 45, signs: ["tight_feeling", "fine_dehydration_lines"] },
    oiliness: { level: "moderate", zones: ["T-zone", "nose"] },
    redness: { present: true, type: "post_acne", severity: "mild" },
    aging: { visibleAgeMarkers: ["fine_lines"], perceivedSkinAge: 28 },
    concerns: [
      "Mild dehydration around cheeks",
      "Minor texture irregularities on forehead",
      "Slight oil overproduction in T-zone",
      "Post-acne marks on chin",
    ],
    recommendations: [
      "Use a gentle hydrating cleanser twice daily",
      "Apply hyaluronic acid serum on damp skin",
      "Use SPF 30+ broad-spectrum sunscreen every morning",
      "Add niacinamide serum to address oil balance and texture",
      "Consider a weekly hydrating sheet mask",
      "Use a lightweight gel moisturizer for T-zone",
      "Incorporate a gentle BHA exfoliant 2x per week",
    ],
    summary: `${note}. Your skin shows a combination pattern with mild dehydration and slight oiliness in the T-zone. Overall skin health is good with minor areas for improvement.`,
    urgentFlag: false,
    urgentReason: null,
    imageQuality: "good",
    imageQualityNote: null,
  };
}

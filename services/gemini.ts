
import { GoogleGenAI, Type } from "@google/genai";
import { IntoleranceItem, HealthProfile, AnalysisResult, MealPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helpers ---

const getModel = () => {
  return 'gemini-2.5-flash';
};

const getVisionModel = () => {
  return 'gemini-2.5-flash';
};

// --- API Functions ---

export const parseReportDocument = async (base64Data: string, mimeType: string): Promise<{ foods: { food: string; level: string }[] }> => {
  const prompt = `
    Analyze this food intolerance report document (image or PDF). 
    Extract all food items and classify them into one of three categories: 'elevated', 'borderline', or 'normal' based on the report's metrics.
    Return a JSON object with a key "foods" containing the list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: getVisionModel(),
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foods: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  level: { type: Type.STRING, enum: ['elevated', 'borderline', 'normal'] }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"foods": []}');
  } catch (error) {
    console.error("Gemini Parse Report Error:", error);
    throw new Error("Failed to analyze report document.");
  }
};

export const analyzeFoodSafety = async (
  query: string,
  intolerances: IntoleranceItem[],
  health: HealthProfile
): Promise<AnalysisResult> => {
  const problemFoods = intolerances
    .filter(i => i.level !== 'normal')
    .map(i => `${i.food} (${i.level})`)
    .join(', ');

  // Note: We use Google Search Grounding here.
  // When using tools like googleSearch, responseMimeType and responseSchema are NOT supported.
  // We must prompt for JSON explicitly and parse the text output.

  const prompt = `
    Act as a clinical nutritionist. 
    First, use Google Search to find the exact ingredients and nutritional profile for: "${query}".
    
    Then, analyze it against this User Profile:
    - Intolerances: ${problemFoods || 'None'}
    - Health Condition: ${health.condition}
    - Dietary Preference: ${health.preference}

    Determine if this food is safe.
    
    Output the result as a strict JSON object wrapped in a code block like this:
    \`\`\`json
    {
      "safetyScore": number (1-10, 10 is safest),
      "glycemicScore": number (1-10, 10 is low impact/good, optional),
      "summary": "string (concise explanation citing specific ingredients)",
      "foundAllergens": ["string" (list specific detected triggers)],
      "healthNote": "string (specific advice for ${health.condition})"
    }
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json", // NOT ALLOWED WITH TOOLS
      }
    });

    // 1. Extract JSON from Markdown
    const text = response.text || '';
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || [null, text];
    let parsedJson: any = {};
    
    try {
      parsedJson = JSON.parse(jsonMatch[1] || text);
    } catch (e) {
      console.warn("JSON Parse failed, attempting fallback or raw text handling", e);
      // Fallback if model refuses JSON: structure a basic object
      parsedJson = {
        safetyScore: 5,
        summary: text.slice(0, 300) + "...",
        foundAllergens: [],
        healthNote: "Could not parse structured analysis. Please read the summary."
      };
    }

    // 2. Extract Grounding Metadata (Sources)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .map(chunk => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || ''
      }))
      .filter(s => s.uri !== '');

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(webSources.map(s => [s.uri, s])).values());

    return {
      ...parsedJson,
      webSources: uniqueSources
    };

  } catch (error) {
    console.error("Gemini Food Analysis Error:", error);
    throw new Error("Failed to analyze food. Please try again.");
  }
};

export const generateMealPlan = async (
  safeFoods: string[],
  health: HealthProfile
): Promise<MealPlan> => {
  const prompt = `
    Create a 1-day meal plan (Breakfast, Lunch, Dinner) using ONLY these safe foods and compatible ingredients: ${safeFoods.join(', ')}.
    Consider the user's health condition: ${health.condition} and preference: ${health.preference}.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: { type: Type.STRING },
            lunch: { type: Type.STRING },
            dinner: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Meal Plan Error:", error);
    throw new Error("Failed to generate meal plan.");
  }
};

export const analyzeProductLabel = async (
  base64Image: string,
  intolerances: IntoleranceItem[]
): Promise<AnalysisResult> => {
  const problemFoods = intolerances
    .filter(i => i.level !== 'normal')
    .map(i => `${i.food} (${i.level})`)
    .join(', ');

  const prompt = `
    Analyze this product label image. Read the ingredients list carefully.
    Check for these specific intolerances: ${problemFoods}.
    
    Output JSON with:
    - safetyScore
    - summary
    - foundAllergens: A list of the specific ingredients found in the text that match the intolerances. Ensure these match the text in the image exactly if possible.
    - ingredientsText: The full, raw text of the ingredients list extracted from the label.
    
    If you detect the ingredients list on the image, provide the bounding box as [ymin, xmin, ymax, xmax] in percentages (0-100).
  `;

  try {
    const response = await ai.models.generateContent({
      model: getVisionModel(),
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safetyScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            foundAllergens: { type: Type.ARRAY, items: { type: Type.STRING } },
            ingredientsText: { type: Type.STRING },
            boundingBox: { 
              type: Type.ARRAY, 
              items: { type: Type.NUMBER },
              description: "Bounding box of the ingredients list [ymin, xmin, ymax, xmax] in percentages 0-100" 
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Label Scan Error:", error);
    throw new Error("Failed to scan label.");
  }
};

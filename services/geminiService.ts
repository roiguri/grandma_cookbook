import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, RECIPE_CATEGORIES } from "../types";
import { getMimeType, getBase64Data } from "./imageUtils";

// Initialize Gemini Client (ONLY used in local dev)
const localApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = localApiKey ? new GoogleGenAI({ apiKey: localApiKey }) : null;

export const analyzeRecipeImage = async (base64Images: string[]): Promise<Recipe> => {
  // ---------------------------------------------------------
  // PATH 1: PRODUCTION (Netlify Function)
  // ---------------------------------------------------------
  // If we are in production OR if we don't have a local key configured, 
  // try the serverless function.
  if (import.meta.env.PROD || !localApiKey) {
    try {
      console.log("Analyzing via Serverless Function...");
      const response = await fetch('/.netlify/functions/analyze-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Optional: Add Auth token here if we implemented strict server-side auth check
        },
        body: JSON.stringify({ images: base64Images })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server Error: ${response.status}`);
      }

      const data = await response.json();
      return data as Recipe;
    } catch (error) {
      console.error("Serverless Function Error:", error);
      throw error;
    }
  }

  // ---------------------------------------------------------
  // PATH 2: LOCAL DEVELOPMENT (Direct Client-Side Call)
  // ---------------------------------------------------------
  if (!ai) {
    throw new Error("Missing VITE_GEMINI_API_KEY for local development");
  }

  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    אתה מומחה קולינרי הדובר עברית רהוטה וטבעית. תפקידך לנתח תמונות של דפי מתכונים ולהפיק מתכון מלא ומסודר בעברית הנאמן למקור ככל הניתן.
    
    דגשים קריטיים:
    1. סיווג המתכון: בחר קטגוריה מתאימה מהרשימה: ${RECIPE_CATEGORIES.join(', ')}.
    2. חלוקת מצרכים: חלק את המצרכים לפי מרכיבי המנה (למשל: "לבצק", "למילוי", "לרוטב") כפי שמופיע או משתמע מהטקסט המקורי.
    3. נאמנות למקור (Strict Fidelity): אל תמציא שלבים, מרכיבים או טיפים שאינם מופיעים בתמונה. היצמד לתוכן המוצג במדויק.
    4. חלוקה לשלבים (Instruction Phases): אם המתכון מורכב מחלקים ברורים (למשל: "הכנת הבצק", "הכנת המילוי"), חלק גם את אופן ההכנה לחלקים אלו. אם המתכון פשוט, השתמש בחלק אחד בשם "אופן ההכנה". אל תמציא חלוקה אם אינה קיימת.
    5. הערות וטיפים: השתמש בשדה ה-tips אך ורק עבור הערות שוליים, טיפים של המחבר, או הערות מיוחדות המופיעות במפורש בטקסט המצולם. **אל תציע טיפים משלך** או המלצות שאינן מופיעות במתכון המקורי.
    6. מבנה: החזר JSON מדויק לפי הסכימה.
  `;

  const imageParts = base64Images.map(imgStr => ({
    inlineData: {
      mimeType: getMimeType(imgStr),
      data: getBase64Data(imgStr),
    },
  }));

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        ...imageParts,
        {
          text: "נתח את התמונות והפק את המתכון בעברית. היצמד למידע הקיים בלבד. אם יש הערות או טיפים בטקסט המקורי, כלול אותם. אל תוסיף מידע חיצוני.",
        },
      ],
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "שם המתכון" },
          category: { type: Type.STRING, description: "קטגוריה" },
          prepTime: { type: Type.STRING, description: "זמן הכנה" },
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "items"]
            }
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "שם החלק" },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "steps"]
            }
          },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          servings: { type: Type.STRING }
        },
        required: ["title", "category", "prepTime", "categories", "steps"]
      }
    },
  });

  try {
    const textOutput = response.text;
    if (!textOutput) throw new Error("Empty response from AI");
    return JSON.parse(textOutput.trim()) as Recipe;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("לא הצלחנו לפענח את המתכון.");
  }
};

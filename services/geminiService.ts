
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, RECIPE_CATEGORIES } from "../types";
import { getMimeType, getBase64Data } from "./imageUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRecipeImage = async (base64Images: string[]): Promise<Recipe> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    אתה מומחה קולינרי הדובר עברית רהוטה וטבעית. תפקידך לנתח תמונות של דפי מתכונים ולהפיק מתכון מלא ומסודר בעברית הנאמן למקור ככל הניתן.
    
    דגשים קריטיים:
    1. סיווג המתכון: בחר קטגוריה מתאימה מהרשימה: ${RECIPE_CATEGORIES.join(', ')}.
    2. חלוקת מצרכים: חלק את המצרכים לפי מרכיבי המנה (למשל: "לבצק", "למילוי", "לרוטב") כפי שמופיע או משתמע מהטקסט המקורי.
    3. נאמנות למקור (Strict Fidelity): אל תמציא שלבים, מרכיבים או טיפים שאינם מופיעים בתמונה. היצמד לתוכן המוצג במדויק.
    4. הערות וטיפים: השתמש בשדה ה-tips אך ורק עבור הערות שוליים, טיפים של המחבר, או הערות מיוחדות המופיעות במפורש בטקסט המצולם. **אל תציע טיפים משלך** או המלצות שאינן מופיעות במתכון המקורי.
    5. מבנה: החזר JSON מדויק לפי הסכימה.
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
          title: { type: Type.STRING, description: "שם המתכון כפי שמופיע במקור" },
          category: { type: Type.STRING, description: "קטגוריית המנה מתוך הרשימה המוגדרת" },
          prepTime: { type: Type.STRING, description: "זמן הכנה (אם מופיע)" },
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "שם רכיב המנה (למשל: לבצק, למלית)" },
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "רשימת מצרכים כפי שכתובים" }
              },
              required: ["name", "items"]
            }
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "שלבי ההכנה המדויקים מהמקור"
          },
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "הערות וטיפים המופיעים במפורש במתכון המקורי בלבד"
          },
          servings: { type: Type.STRING, description: "מספר מנות (אם מופיע)" }
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
    throw new Error("לא הצלחנו לפענח את המתכון בצורה תקינה. וודאו שהתמונות ברורות והטקסט קריא.");
  }
};

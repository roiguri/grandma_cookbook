
import { Handler } from '@netlify/functions';

// Initialize Gemini Client
// Note: On Netlify, standard env vars are accessible via process.env
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!apiKey) {
    console.error("Missing Gemini API Key in server environment");
    return { statusCode: 500, body: 'Server Configuration Error' };
  }

  try {
    const { images } = JSON.parse(event.body || '{}');

    if (!images || !Array.isArray(images) || images.length === 0) {
      return { statusCode: 400, body: 'No images provided' };
    }

    // Initialize Gemini (older SDK style for Node, or using the new one if compatible)
    // The @google/genai package is the new one.
    // Let's use the REST API approach strictly if the SDK is acting up, 
    // BUT since we have the SDK installed, let's try to use the GenAI class if available.
    // However, the import above might be for the web SDK? 
    // Actually the user has "@google/genai": "^1.34.0".

    // Let's assume standard GenAI usage
    // Wait, the user was using `import { GoogleGenerativeAI } from "@google/generative-ai";` in previous code?
    // User's package.json says `"@google/genai": "^1.34.0"`. This looks like the NEW SDK.
    // BUT the existing code in `geminiService.ts` (which I haven't seen fully but assume works) likely uses it.

    // Let's use a standard fetch to the Gemini REST API to be safe and dependency-free in the function 
    // if we don't want to bundle huge node modules, BUT Netlify bundles fine.
    // Let's use the simplest REST call to avoid "Module not found" issues if the bundler misses it.

    const MODEL_NAME = "gemini-3-flash-preview";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    // Construct parts
    const parts: any[] = [
      {
        text: `
        אתה מומחה קולינרי הדובר עברית רהוטה וטבעית. תפקידך לנתח תמונות של דפי מתכונים ולהפיק מתכון מלא ומסודר בעברית הנאמן למקור ככל הניתן.

        דגשים קריטיים:
        1. סיווג המתכון: בחר קטגוריה מתאימה מהרשימה: עוגות/עוגיות, מאפים, סלטים, תוספות, עיקריות, קינוחים.
        2. חלוקת מצרכים: חלק את המצרכים לפי מרכיבי המנה (למשל: "לבצק", "למילוי", "לרוטב") כפי שמופיע או משתמע מהטקסט המקורי.
        3. נאמנות למקור (Strict Fidelity): אל תמציא שלבים, מרכיבים או טיפים שאינם מופיעים בתמונה. היצמד לתוכן המוצג במדויק.
        4. הערות וטיפים: השתמש בשדה ה-tips אך ורק עבור הערות שוליים, טיפים של המחבר, או הערות מיוחדות המופיעות במפורש בטקסט המצולם. **אל תציע טיפים משלך** או המלצות שאינן מופיעות במתכון המקורי.
        5. מבנה: החזר JSON מדויק לפי הסכימה הבאה. אל תוסיף שום טקסט אחר (כגון \`\`\`json).

        Format:
        {
          "title": "Recipe Title (Hebrew)",
          "category": "String",
          "prepTime": "String",
          "servings": "String",
          "difficulty": "String",
          "categories": [
             { "name": "Category Name", "items": ["item1", "item2"] }
          ],
          "steps": ["Step 1", "Step 2"],
           "tips": ["Tip 1"]
        }
        `
      }
    ];

    // Add images
    images.forEach(base64Str => {
      // base64Str is "data:image/jpeg;base64,....."
      const [meta, data] = base64Str.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];

      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: data
        }
      });
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error", data);
      throw new Error(data.error?.message || "Failed to fetch from Gemini");
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      throw new Error("Empty response from Gemini");
    }

    // Clean markdown if present
    const jsonStr = textResult.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: jsonStr
    };

  } catch (error: any) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

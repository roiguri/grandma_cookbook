
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

    const MODEL_NAME = "gemini-3-flash-preview";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    // System Instruction
    const systemInstructionTest = `
    אתה מומחה קולינרי הדובר עברית רהוטה וטבעית. תפקידך לנתח תמונות של דפי מתכונים ולהפיק מתכון מלא ומסודר בעברית הנאמן למקור ככל הניתן.
    
    דגשים קריטיים:
    1. סיווג המתכון: בחר קטגוריה מתאימה מהרשימה: עוגות/עוגיות, מאפים, סלטים, תוספות, עיקריות, קינוחים.
    2. חלוקת מצרכים: חלק את המצרכים לפי מרכיבי המנה (למשל: "לבצק", "למילוי", "לרוטב") כפי שמופיע או משתמע מהטקסט המקורי.
    3. נאמנות למקור (Strict Fidelity): אל תמציא שלבים, מרכיבים או טיפים שאינם מופיעים בתמונה. היצמד לתוכן המוצג במדויק.
    4. חלוקה לשלבים (Instruction Phases): אם המתכון מורכב מחלקים ברורים (למשל: "הכנת הבצק", "הכנת המילוי"), חלק גם את אופן ההכנה לחלקים אלו. אם המתכון פשוט, השתמש בחלק אחד בשם "אופן ההכנה". אל תמציא חלוקה אם אינה קיימת.
    5. הערות וטיפים: השתמש בשדה ה-tips אך ורק עבור הערות שוליים, טיפים של המחבר, או הערות מיוחדות המופיעות במפורש בטקסט המצולם. **אל תציע טיפים משלך** או המלצות שאינן מופיעות במתכון המקורי.
    6. מבנה: החזר JSON מדויק לפי הסכימה.
    `;

    // Construct User Parts (Images + Prompt)
    const parts: any[] = [];

    // Add images
    images.forEach(base64Str => {
      const [meta, data] = base64Str.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];

      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: data
        }
      });
    });

    // Add Text Prompt (User Message)
    parts.push({
      text: "נתח את התמונות והפק את המתכון בעברית. היצמד למידע הקיים בלבד. אם יש הערות או טיפים בטקסט המקורי, כלול אותם. אל תוסיף מידע חיצוני."
    });

    // Construct Payload
    const payload = {
      system_instruction: {
        parts: [{ text: systemInstructionTest }]
      },
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "שם המתכון" },
            category: { type: "STRING", description: "קטגוריה" },
            prepTime: { type: "STRING", description: "זמן הכנה" },
            categories: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  items: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["name", "items"]
              }
            },
            steps: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "שם החלק (למשל 'אופן ההכנה' או 'הכנת הבצק')" },
                  steps: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["name", "steps"]
              }
            },
            tips: { type: "ARRAY", items: { type: "STRING" } },
            servings: { type: "STRING" }
          },
          required: ["title", "category", "prepTime", "categories", "steps"]
        }
      }
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

    // Since we requested JSON mode, the output should be clean JSON.
    // Parsing it to ensure validity before returning, but sending string back.
    // The previous code cleaned markdown, which is safe to keep just in case.
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

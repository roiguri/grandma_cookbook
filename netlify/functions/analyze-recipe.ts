
import { Handler } from '@netlify/functions';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const firebaseApiKey = process.env.FIREBASE_API_KEY;
const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  if (!firebaseApiKey) {
    console.error("Missing FIREBASE_API_KEY — cannot verify token");
    return null;
  }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.users?.length) return null;
    return data.users[0].email as string;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // --- Auth ---
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!idToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth token' }) };
  }

  const email = await verifyFirebaseToken(idToken);
  if (!email) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid auth token' }) };
  }

  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Access denied' }) };
  }

  // --- Gemini ---
  if (!geminiApiKey) {
    console.error("Missing Gemini API Key in server environment");
    return { statusCode: 500, body: 'Server Configuration Error' };
  }

  try {
    const { images } = JSON.parse(event.body || '{}');

    if (!images || !Array.isArray(images) || images.length === 0) {
      return { statusCode: 400, body: 'No images provided' };
    }

    const MODEL_NAME = "gemini-2.0-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`;

    const systemInstruction = `
    אתה מומחה קולינרי הדובר עברית רהוטה וטבעית. תפקידך לנתח תמונות של דפי מתכונים ולהפיק מתכון מלא ומסודר בעברית הנאמן למקור ככל הניתן.

    דגשים קריטיים:
    1. סיווג המתכון: בחר קטגוריה מתאימה מהרשימה: עוגות/עוגיות, מאפים, סלטים, תוספות, עיקריות, קינוחים.
    2. חלוקת מצרכים: חלק את המצרכים לפי מרכיבי המנה (למשל: "לבצק", "למילוי", "לרוטב") כפי שמופיע או משתמע מהטקסט המקורי.
    3. נאמנות למקור (Strict Fidelity): אל תמציא שלבים, מרכיבים או טיפים שאינם מופיעים בתמונה. היצמד לתוכן המוצג במדויק.
    4. חלוקה לשלבים (Instruction Phases): אם המתכון מורכב מחלקים ברורים (למשל: "הכנת הבצק", "הכנת המילוי"), חלק גם את אופן ההכנה לחלקים אלו. אם המתכון פשוט, השתמש בחלק אחד בשם "אופן ההכנה". אל תמציא חלוקה אם אינה קיימת.
    5. הערות וטיפים: השתמש בשדה ה-tips אך ורק עבור הערות שוליים, טיפים של המחבר, או הערות מיוחדות המופיעות במפורש בטקסט המצולם. **אל תציע טיפים משלך** או המלצות שאינן מופיעות במתכון המקורי.
    6. מבנה: החזר JSON מדויק לפי הסכימה.
    `;

    const parts: any[] = [];
    images.forEach((base64Str: string) => {
      const [meta, data] = base64Str.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      parts.push({ inline_data: { mime_type: mimeType, data } });
    });
    parts.push({
      text: "נתח את התמונות והפק את המתכון בעברית. היצמד למידע הקיים בלבד. אם יש הערות או טיפים בטקסט המקורי, כלול אותם. אל תוסיף מידע חיצוני."
    });

    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
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
    if (!textResult) throw new Error("Empty response from Gemini");

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

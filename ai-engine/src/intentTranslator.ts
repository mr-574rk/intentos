import fetch from "node-fetch";

// Local mappings for standard keywords to skip LLM cost/latency when possible
const KEYWORD_MAP: Record<string, Record<string, string>> = {
  zh: {
    "兑换": "swap",
    "交换": "swap",
    "买": "buy",
    "质押": "stake",
    "取消质押": "unstake",
    "提取": "claim",
    "发送": "send",
    "到": "to",
    "和": "and"
  },
  es: {
    "intercambiar": "swap",
    "comprar": "buy",
    "apostar": "stake",
    "desapostar": "unstake",
    "reclamar": "claim",
    "enviar": "send",
    "a": "to",
    "y": "and"
  },
  fr: {
    "échanger": "swap",
    "acheter": "buy",
    "miser": "stake",
    "retirer": "unstake",
    "réclamer": "claim",
    "envoyer": "send",
    "à": "to",
    "et": "and"
  },
  pt: {
    "trocar": "swap",
    "comprar": "buy",
    "apostar": "stake",
    "desapostar": "unstake",
    "reivindicar": "claim",
    "enviar": "send",
    "para": "to",
    "e": "and"
  }
};

/**
 * Attempts a fast, local translation using dictionary replacement.
 * Only covers common DeFi verbs/conjunctions to aid the English-only regex parser.
 */
function fastLocalNormalize(text: string, lang: string): string {
  const dict = KEYWORD_MAP[lang];
  if (!dict) return text;

  let normalized = text;
  for (const [foreign, english] of Object.entries(dict)) {
    // Basic string replacement. For Chinese, word boundaries (\b) don't work the same way,
    // so we just replace the characters globally.
    if (lang === "zh") {
      normalized = normalized.split(foreign).join(english);
    } else {
      const regex = new RegExp(`\\b${foreign}\\b`, "gi");
      normalized = normalized.replace(regex, english);
    }
  }
  return normalized;
}

/**
 * Normalizes multi-lingual intents to English for the parser.
 * Tier 1: English check (fast pass)
 * Tier 2: LLM Translation via OpenRouter (Gemini Flash 8B)
 */
export async function translateIfNeeded(text: string, locale: string = "en"): Promise<string> {
  // 1. Fast pass: If it's explicitly English or missing a locale, return as-is
  if (!locale || locale === "en") return text;

  // 2. Try OpenRouter formatting if key exists
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    // Graceful degradation: Attempt local keyword mapping if LLM is unavailable
    console.warn("[i18n] OPENROUTER_API_KEY missing, falling back to local keyword normalization.");
    return fastLocalNormalize(text, locale);
  }

  const model = process.env.OPENROUTER_MODEL || "google/gemini-flash-1.5-8b";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a precise DeFi intent translator. Translate the user's request into English. Preserve all token symbols (e.g. INIT, USDC, ETH), amounts, and addresses exactly as they appear. Output ONLY the translated English text, no explanations or pleasantries."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      console.error(`[i18n] OpenRouter API error: ${response.status} ${response.statusText}`);
      return fastLocalNormalize(text, locale);
    }

    const data: any = await response.json();
    const translated = data?.choices?.[0]?.message?.content?.trim();
    
    if (translated) {
      console.log(`[i18n] Translated (${locale} -> en): "${text}" -> "${translated}"`);
      return translated;
    }

    return fastLocalNormalize(text, locale);
  } catch (error) {
    console.error(`[i18n] Translation service failed:`, error);
    return fastLocalNormalize(text, locale); // Fallback
  }
}

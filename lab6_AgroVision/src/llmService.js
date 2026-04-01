import { fallbackRecommendation, buildRecommendationPrompt } from "./recommendationEngine.js";

const OPENAI_URL = "https://api.openai.com/v1/responses";

export async function generateRecommendation(summary) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    const local = fallbackRecommendation(summary);
    return { ...local, source: "fallback" };
  }

  const prompt = buildRecommendationPrompt(summary);
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 1500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 220
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const outputText = extractText(data);
    const parsed = parseModelResponse(outputText);

    return { ...parsed, source: "openai" };
  } catch {
    const local = fallbackRecommendation(summary);
    return { ...local, source: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}

function extractText(data) {
  if (!data || !Array.isArray(data.output)) {
    return "";
  }

  const chunks = [];

  for (const item of data.output) {
    if (!item || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text.trim());
      }
    }
  }

  return chunks.join(" ").trim();
}

function parseModelResponse(text) {
  if (!text) {
    return { text: "Рекомендация сформирована локально из правил.", actions: [] };
  }

  const [head, tail] = text.split(":");
  const cleanText = tail ? `${head}: ${tail.split(";")[0].trim()}` : text;
  const actions = tail
    ? tail
        .split(";")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  return { text: cleanText, actions: actions.slice(0, 4) };
}

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/wotd-languages/?word=EPHEMERAL
 * 
 * Uses Llama 3.1 8B Instruct (multilingual-capable) to return translations of an English
 * word in up to 5 languages: French, Spanish, German, Italian, and Portuguese.
 * 
 * Note: GLM-4.7-flash was the intended model but its Workers AI response format
 * (OpenAI-compatible with reasoning) doesn't reliably return content. Llama-fast
 * handles translation tasks well and returns structured JSON consistently.
 * 
 * Returns: { word, translations: [{ language, translation }] }
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const word = url.searchParams.get('word')?.trim().toUpperCase();

  if (!word || word.length < 2 || word.length > 20) {
    return json({ error: 'Valid word parameter required (2-20 characters)' }, 400);
  }

  const AI = (env as any).AI;
  if (!AI) {
    return json({ error: 'AI service unavailable' }, 503);
  }

  try {
    const prompt = `Translate the English word "${word}" into these 5 languages. Return ONLY a JSON array with no other text. Each item must have "language" and "translation" fields. Use lowercase for translations.

Languages: French, Spanish, German, Italian, Portuguese

Example response for "EPHEMERAL":
[{"language":"French","translation":"éphémère"},{"language":"Spanish","translation":"efímero"},{"language":"German","translation":"kurzlebig"},{"language":"Italian","translation":"effimero"},{"language":"Portuguese","translation":"efêmero"}]

Now translate "${word}":`;

    const aiResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a precise multilingual translator. Return ONLY valid JSON arrays. No explanations, no markdown, no extra text. Just the JSON array.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.2,
    });

    // Handle various response structures
    let raw = '';
    if (typeof aiResponse === 'string') {
      raw = aiResponse;
    } else if (typeof aiResponse?.response === 'string') {
      raw = aiResponse.response;
    } else if (typeof aiResponse?.choices?.[0]?.message?.content === 'string') {
      raw = aiResponse.choices[0].message.content;
    } else {
      raw = JSON.stringify(aiResponse);
    }

    // Extract JSON array from the response (handle potential wrapping text)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return json({ error: 'Could not parse translations' }, 500);
    }

    const translations = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(translations) || translations.length === 0) {
      return json({ error: 'Invalid translation format' }, 500);
    }

    // Clean and validate each entry
    const cleaned = translations
      .filter((t: any) => t.language && t.translation)
      .slice(0, 5)
      .map((t: any) => ({
        language: String(t.language).trim(),
        translation: String(t.translation).trim().toLowerCase(),
      }));

    return json({ word, translations: cleaned }, 200, {
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    });
  } catch {
    return json({ error: 'Translation request failed' }, 500);
  }
};

function json(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

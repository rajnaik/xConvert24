import { Agent, routeAgentRequest } from "agents";
import { withVoice, WorkersAIFluxSTT, WorkersAITTS } from "@cloudflare/voice";
import { streamText, tool, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { z } from "zod";

const SYSTEM_PROMPT = `You are Lex, the xSoft voice assistant. You represent xSoft Ltd, a software consultancy based in England (Company No. 17308915) founded by Raj Naik.

Your job is to:
1. Answer questions about xSoft's services and capabilities
2. Qualify leads — understand their project needs
3. Provide pricing information
4. Offer to connect them with the team

SERVICES & PRICING:
- AI Chatbots: £1,000/week. Custom chatbots trained on business data. RAG-powered, 24/7, sub-200ms responses. Typical delivery: 2-4 weeks.
- Web Development: High-performance websites on Cloudflare Workers + Astro. SEO-first, admin dashboards included. Quote per project.
- Chrome Extensions: Browser extensions published to Chrome Web Store. Manifest V3, analytics included.
- SEO & Content: Technical SEO audits, structured data, AI content at scale (we've deployed 1000+ pages on one site).

CASE STUDIES:
- ScrabbleWordsFinder.com: AI word game platform, 1000+ pages, 6 games, world rankings, RAG chatbot called Lex
- xConvert24.com: 60+ converters and tools, Chrome extension (Auto Button Clicker)
- xCrypto24.com (Beta): Real-time crypto tracking, bubble charts, portfolio management

TECH STACK:
Cloudflare Workers, Workers AI, D1, KV, Vectorize, Astro, Tailwind, TypeScript, Playwright, Python

QUALIFICATION QUESTIONS (ask naturally, not all at once):
- What does their business do?
- What problem are they trying to solve?
- What's their timeline?
- Have they tried other solutions?

TONE:
- Professional but warm and conversational
- Concise — you're being spoken aloud, keep responses under 3 sentences where possible
- British English spelling and phrasing
- Never make up capabilities we don't have
- If asked something you don't know, say "I'd need to check with the team on that — shall I have them follow up by email?"

CONTACT:
- Email: info@xsoftlimited.com
- Website: xsoftlimited.com

Always be helpful and honest. If a project isn't a good fit, say so politely.`;

const VoiceAgent = withVoice(Agent);

export class XSoftVoiceAgent extends VoiceAgent {
  transcriber = new WorkersAIFluxSTT((this as any).env.AI);
  tts = new WorkersAITTS((this as any).env.AI);

  async onTurn(transcript: string, context: any) {
    const workersAi = createWorkersAI({ binding: (this as any).env.AI });

    const result = streamText({
      model: workersAi("@cf/moonshotai/kimi-k2.6"),
      system: SYSTEM_PROMPT,
      messages: [
        ...context.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: transcript },
      ],
      tools: {
        get_pricing: tool({
          description: "Get pricing information for a specific service",
          parameters: z.object({
            service: z.enum(["ai-chatbot", "web-development", "chrome-extension", "seo"]),
          }),
          execute: async ({ service }) => {
            const pricing: Record<string, string> = {
              "ai-chatbot": "£1,000 per week. Typical project is 2-4 weeks, so £2,000 to £4,000 total. Includes training, deployment, and 30 days support.",
              "web-development": "Quoted per project based on complexity. Typically starts at £2,000 for a simple site, up to £10,000+ for full platforms.",
              "chrome-extension": "£1,000 to £3,000 depending on complexity. Includes Chrome Web Store submission and review process.",
              "seo": "£1,000 per week for active work. Minimum engagement: 2 weeks for audit + implementation.",
            };
            return { pricing: pricing[service] || "Please contact us for a custom quote." };
          },
        }),
        schedule_followup: tool({
          description: "When the caller wants to be contacted by email or schedule a call",
          parameters: z.object({
            name: z.string().describe("Caller's name if provided"),
            interest: z.string().describe("What they're interested in"),
          }),
          execute: async ({ name, interest }) => {
            // In production, this could save to D1 or send an email
            return {
              message: `Great, I'll have the team reach out to ${name || 'you'} about ${interest}. They'll email within 24 hours.`,
            };
          },
        }),
      },
      stopWhen: stepCountIs(3),
      abortSignal: context.signal,
    });

    return result.textStream;
  }

  async onCallStart(connection: any) {
    await this.speak(
      connection,
      "Hi there! I'm Lex from xSoft. I can tell you about our services, pricing, or help you figure out if we're the right fit for your project. What can I help you with?"
    );
  }

  // Filter out noise/short utterances
  afterTranscribe(transcript: string) {
    if (transcript.trim().length < 3) return null;
    return transcript;
  }

  // Clean up pronunciation for TTS
  beforeSynthesize(text: string) {
    return text
      .replace(/\bAI\b/g, "A.I.")
      .replace(/\bRAG\b/g, "rag")
      .replace(/\bSSR\b/g, "server-side rendering")
      .replace(/\bD1\b/g, "D-one")
      .replace(/\bKV\b/g, "K.V.");
  }
}

export default {
  async fetch(request: Request, env: any) {
    // CORS headers for cross-origin widget embedding
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Upgrade",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await routeAgentRequest(request, env);
    if (response) {
      // Add CORS to all responses
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return new Response("xSoft Voice Agent — WebSocket endpoint", { status: 200 });
  },
};

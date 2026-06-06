import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { readFileSync } from 'fs';

/**
 * GET /api/cicd-pipeline — get current pipeline XML config
 * POST /api/cicd-pipeline — update pipeline XML config (toggle steps on/off)
 *   Body: { steps: { id: string, enabled: boolean }[] }
 */

// Default pipeline XML (embedded as fallback)
const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<BuildPipeline version="1.0" lastUpdated="">
  <steps>
    <step id="1" name="Write Code &amp; Tests" description="Developer writes feature code and corresponding test cases" enabled="true" gate="false"><tools>TypeScript,Astro,Tailwind CSS,Playwright,Kiro IDE</tools></step>
    <step id="2" name="Compile &amp; Type Check" description="Astro build compiles all pages, checks TypeScript types, resolves imports" enabled="true" gate="true"><tools>Astro Build,TypeScript Compiler,Vite</tools></step>
    <step id="3" name="Run Tests &amp; Playwright" description="Playwright end-to-end tests run against the built site" enabled="true" gate="true"><tools>Playwright,Nova Act (AI QA),Axe Accessibility</tools></step>
    <step id="4" name="Code Review" description="Automated code review checks code quality, complexity, duplication" enabled="true" gate="true"><tools>SonarQube,ESLint,AI Review (Cubic)</tools></step>
    <step id="5" name="Checkmarx SAST Scan" description="Static Application Security Testing for vulnerabilities" enabled="true" gate="true"><tools>Checkmarx SAST,Secret Detection,OWASP Top 10</tools></step>
    <step id="6" name="Scout QA Tests" description="AI-powered exploratory testing — visual regressions, broken links" enabled="true" gate="true"><tools>ScoutQA,Visual Regression,Link Checker</tools></step>
    <step id="7" name="SonarQube Quality Gate" description="Code smells, technical debt, coverage metrics" enabled="true" gate="true"><tools>SonarQube,Coverage Report,Quality Gate</tools></step>
    <step id="8" name="Aikido Security Scan" description="Final security gate — SAST, IaC, secrets detection" enabled="true" gate="true"><tools>Aikido SAST,Secrets Scan,IaC Scan</tools></step>
    <step id="9" name="Production Build" description="Optimised production build — tree-shaking, minification" enabled="true" gate="false"><tools>Astro Build,Vite,Tailwind CSS,Cloudflare Images</tools></step>
    <step id="10" name="Deploy to Staging" description="Deploy to Cloudflare Workers staging environment" enabled="true" gate="false"><tools>Cloudflare Workers,Wrangler CLI,staging.xconvert24.com</tools></step>
    <step id="11" name="Post-Deployment Tests" description="Nova Act QA tests against staging" enabled="true" gate="true"><tools>Nova Act,pytest,Browser Automation</tools></step>
    <step id="12" name="Deploy to Production" description="Promote to live production on Cloudflare" enabled="true" gate="false"><tools>Cloudflare Workers,Cloudflare Pages,Wrangler CLI,Global CDN,D1 Database</tools></step>
    <step id="13" name="Post-Live Tests" description="Final verification tests against production" enabled="true" gate="true"><tools>Nova Act,Playwright,Browser Automation</tools></step>
  </steps>
</BuildPipeline>`;

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ xml: DEFAULT_XML }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const row = await db.prepare('SELECT pipeline_xml FROM cicd_pipeline WHERE id = 1').first();
  const xml = row?.pipeline_xml || DEFAULT_XML;

  return new Response(JSON.stringify({ xml }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { steps } = body;
  if (!steps || !Array.isArray(steps)) {
    return new Response(JSON.stringify({ error: 'steps array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get current XML
  const row = await db.prepare('SELECT pipeline_xml FROM cicd_pipeline WHERE id = 1').first();
  let xml = row?.pipeline_xml || DEFAULT_XML;

  // Update enabled status for each step
  for (const step of steps) {
    const enabledValue = step.enabled ? 'true' : 'false';
    // Replace enabled="true/false" for the matching step id
    const regex = new RegExp(
      `(<step id="${step.id}"[^>]*?)enabled="(true|false)"`,
      'g'
    );
    xml = xml.replace(regex, `$1enabled="${enabledValue}"`);
  }

  // Update lastUpdated
  const now = new Date().toISOString();
  xml = xml.replace(/lastUpdated="[^"]*"/, `lastUpdated="${now}"`);

  // Upsert into database
  await db.prepare(
    'INSERT OR REPLACE INTO cicd_pipeline (id, pipeline_xml, updated_at, updated_by) VALUES (1, ?, datetime("now"), ?)'
  ).bind(xml, 'admin').run();

  return new Response(JSON.stringify({ success: true, xml }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const COMPETITORS = [
  { name: 'Planview', domain: 'planview.com', tier: 1 }
  // Add more competitors here
];

const OUR_PRODUCT = `Cora Systems — enterprise project and portfolio management (PPM) platform.
Primary buyer: PMO Directors and CIOs at organisations with 500–10,000 employees
in public sector, financial services, and regulated industries.
Market: Enterprise PPM / Strategic Portfolio Management (SPM).
Geography: UK, Ireland, Western Europe, North America.
Differentiators: EVM, benefits tracking, programme governance, public sector compliance,
FedRAMP pursuit, faster implementation (6–8 weeks vs 6–9 months).`;

function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error.message);
          resolve(parsed.content[0].text);
        } catch (e) { reject(new Error('API error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildHTML(competitor, date, report) {
  const body = report
    .replace(/^### (.+)$/gm, '<h4 style="color:#171340;font-size:13px;font-weight:700;margin:16px 0 8px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#171340;font-size:15px;font-weight:700;margin:24px 0 10px;border-bottom:2px solid #DF0062;padding-bottom:6px;">$1</h3>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<div style="font-weight:700;color:#171340;margin:12px 0 6px;">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\[Data\]/gm, '<span style="background:#E5F4F3;color:#002A33;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;">[Data]</span>')
    .replace(/^\[Estimate\]/gm, '<span style="background:#FFEEF6;color:#DF0062;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;">[Estimate]</span>')
    .replace(/^\[Assumption\]/gm, '<span style="background:#F9E5EF;color:#3B0338;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;">[Assumption]</span>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:6px;padding-left:12px;border-left:3px solid #DF0062;font-size:12px;line-height:1.5;">$1</li>')
    .replace(/\n\n/g, '</p><p style="line-height:1.6;font-size:13px;color:#333333;margin-bottom:12px;">')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #333333; background: #fff; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div style="background:#171340;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;">
  <div style="display:flex;align-items:center;">
    <div style="background:linear-gradient(180deg,#5957FF 0%,#DF0062 100%);width:6px;height:38px;margin-right:16px;border-radius:2px;"></div>
    <div>
      <div style="color:rgba(255,255,255,0.6);font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Competitive Intelligence</div>
      <div style="color:#fff;font-size:18px;font-weight:700;margin-top:1px;">${competitor.name} — Monthly Intel Report</div>
    </div>
  </div>
  <div style="text-align:right;">
    <div style="color:rgba(255,255,255,0.5);font-size:10px;">enterprise-competitor-intel</div>
    <div style="color:#fff;font-size:13px;font-weight:600;margin-top:2px;">${date}</div>
  </div>
</div>
<div style="background:#F5F3F3;border-bottom:1px solid #BBBDBF;padding:10px 28px;display:flex;gap:28px;align-items:center;flex-wrap:wrap;">
  <div><span style="color:#BBBDBF;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Competitor</span><span style="margin-left:6px;font-weight:700;color:#171340;">${competitor.name}</span></div>
  <div><span style="color:#BBBDBF;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Domain</span><span style="margin-left:6px;font-weight:700;color:#171340;">${competitor.domain}</span></div>
  <div><span style="color:#BBBDBF;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Tier</span><span style="margin-left:6px;font-weight:700;color:#171340;">${competitor.tier}</span></div>
  <div><span style="background:#FFEEF6;color:#DF0062;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">⚠ Knowledge-Based — verify independently</span></div>
</div>
<div style="max-width:980px;margin:0 auto;padding:28px;">
  <p style="line-height:1.6;font-size:13px;color:#333333;margin-bottom:12px;">${body}</p>
</div>
<div style="background:#F5F3F3;border-top:1px solid #BBBDBF;padding:12px 28px;text-align:center;color:#BBBDBF;font-size:11px;margin-top:40px;">
  Cora Systems — Competitive Intelligence | Generated ${date} | For internal use only
</div>
</body></html>`;
}

async function generatePDF(html, outputPath) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
  await browser.close();
}

async function runIntelForCompetitor(competitor) {
  console.log('\n🔍 Running intel for ' + competitor.name + '...');
  const date = new Date().toISOString().split('T')[0];

  const prompt = `You are a competitive intelligence analyst. Produce a comprehensive monthly intel report on ${competitor.name} for Cora Systems.

OUR PRODUCT: ${OUR_PRODUCT}

COMPETITOR: ${competitor.name} (${competitor.domain})
REPORT DATE: ${date}

Produce a full intel report covering:

## Executive Summary
2-3 paragraphs on competitive position, key dynamics, top opportunities and risks.

## Company Overview
Product, team size, funding, traction, target ICP.

## Pricing Intelligence
Published tiers, enterprise pricing signals, value metric, switching costs.

## Customer Sentiment
Key strengths from reviews, key weaknesses, win/loss patterns vs Cora.

## Battle Card
How to win against ${competitor.name}, when they beat us and why, key objections and responses, displacement triggers.

## Go-To-Market
Primary acquisition channels, sales motion, recent campaign themes.

## Strategic Signals
Recent hires, job postings, funding/M&A, product roadmap signals.

## Data Gaps
List anything you could not verify.

Label all claims [Data], [Estimate], or [Assumption]. Never invent pricing — mark as [Estimate] with reasoning. Date all time-sensitive information.`;

  const report = await callAnthropic(prompt);
  const html = buildHTML(competitor, date, report);

  if (!fs.existsSync('intel-outputs')) fs.mkdirSync('intel-outputs');
  const pdfPath = path.join('intel-outputs', competitor.name.toLowerCase() + '-intel-' + date + '.pdf');
  await generatePDF(html, pdfPath);
  console.log('✅ PDF saved: ' + pdfPath);

  return { competitor: competitor.name, file: pdfPath, status: 'success' };
}

async function main() {
  console.log('🚀 Starting monthly competitor intel...');
  console.log('📅 Date: ' + new Date().toISOString().split('T')[0]);

  const results = [];
  for (const competitor of COMPETITORS) {
    try {
      results.push(await runIntelForCompetitor(competitor));
    } catch (error) {
      console.error('❌ Failed for ' + competitor.name + ':', error.message);
      results.push({ competitor: competitor.name, status: 'failed', error: error.message });
    }
  }

  console.log('\n📊 Run Summary:');
  results.forEach(r => console.log('  ' + (r.status === 'success' ? '✅' : '❌') + ' ' + r.competitor + ': ' + r.status));
  if (results.some(r => r.status === 'failed')) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

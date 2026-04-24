const https = require('https');
const fs = require('fs');
const path = require('path');

const COMPETITORS = [
  {
    name: 'Planview',
    domain: 'planview.com',
    tier: 1
  }
  // Add more competitors here next week
];

const OUR_PRODUCT = `
Cora Systems — enterprise project and portfolio management (PPM) platform.
Primary buyer: PMO Directors and CIOs at organisations with 500–10,000 employees
in public sector, financial services, and regulated industries.
Market: Enterprise Project Portfolio Management (PPM) / Strategic Portfolio Management (SPM).
Geography: UK, Ireland, Western Europe, North America.
Strongest differentiators: faster implementation (6–8 weeks vs 6–9 months),
public sector compliance specialisation, EVM, benefits tracking, programme governance,
FedRAMP pursuit, higher end-user adoption rates.
`;

function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-opus-4-5-20251101',
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
          resolve(parsed.content[0].text);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runIntelForCompetitor(competitor) {
  console.log(`\n🔍 Running intel for ${competitor.name}...`);

  const prompt = `
You are a competitive intelligence analyst. Run a deep competitive intelligence 
analysis for the following competitor on behalf of Cora Systems.

OUR PRODUCT:
${OUR_PRODUCT}

COMPETITOR TO RESEARCH:
Name: ${competitor.name}
Domain: ${competitor.domain}
Tier: ${competitor.tier}

Please produce a comprehensive competitive intelligence report covering:

1. COMPANY OVERVIEW
   - Product overview, core features, key differentiators
   - Team size, funding history, recent news
   - Target market and ICP

2. PRICING INTELLIGENCE
   - Published pricing tiers
   - Enterprise pricing signals
   - Value metric (per seat / usage / flat)

3. CUSTOMER SENTIMENT
   - Key strengths (from reviews)
   - Key weaknesses (from reviews)
   - Win/loss patterns vs Cora

4. GO-TO-MARKET
   - Primary acquisition channels
   - Sales motion (PLG / sales-led / hybrid)
   - Recent campaign themes

5. BATTLE CARD
   - How to win against ${competitor.name}
   - When they beat us and why
   - Key objections and responses
   - Displacement triggers

6. STRATEGIC SIGNALS
   - Recent hires, job postings
   - Funding/M&A activity
   - Product roadmap signals

7. DATA GAPS
   - List anything you could not verify

Format as a clean markdown report. Label all claims as [Data], [Estimate], or [Assumption].
Date all time-sensitive information. Never invent pricing — mark as [Estimate] with reasoning.
`;

  const report = await callAnthropic(prompt);

  // Save to outputs folder
  const date = new Date().toISOString().split('T')[0];
  const filename = `${competitor.name.toLowerCase()}-intel-${date}.md`;
  const outputPath = path.join('intel-outputs', filename);

  fs.writeFileSync(outputPath, report);
  console.log(`✅ ${competitor.name} intel saved to ${outputPath}`);

  return { competitor: competitor.name, file: outputPath };
}

async function main() {
  console.log('🚀 Starting monthly competitor intel run...');
  console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`📋 Competitors: ${COMPETITORS.map(c => c.name).join(', ')}`);

  const results = [];

  for (const competitor of COMPETITORS) {
    try {
      const result = await runIntelForCompetitor(competitor);
      results.push({ ...result, status: 'success' });
    } catch (error) {
      console.error(`❌ Failed for ${competitor.name}:`, error.message);
      results.push({ competitor: competitor.name, status: 'failed', error: error.message });
    }
  }

  // Summary
  console.log('\n📊 Run Summary:');
  results.forEach(r => {
    const icon = r.status === 'success' ? '✅' : '❌';
    console.log(`  ${icon} ${r.competitor}: ${r.status}`);
  });

  const failed = results.filter(r => r.status === 'failed');
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

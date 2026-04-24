# Competitor Intel Runner

Monthly automated competitive intelligence for Cora Systems, powered by Claude.

## Schedule
Runs automatically on the **1st of every month at 08:00 UTC**.
Can also be triggered manually via GitHub Actions → Run workflow.

## Outputs
Reports are saved to `intel-outputs/` as markdown files:
`{competitor}-intel-{YYYY-MM-DD}.md`

## Adding Competitors
Edit `scripts/run-intel.js` and add to the `COMPETITORS` array:
```js
{
  name: 'Competitor Name',
  domain: 'competitordomain.com',
  tier: 1
}
```

## Setup
1. Add `ANTHROPIC_API_KEY` to GitHub repo Secrets
2. Enable GitHub Actions
3. Push to main branch — first run is on the 1st of next month
4. To run immediately: Actions → Competitor Intel — Monthly Run → Run workflow

# Lead File Template

When generating a lead file, copy and fill in this template exactly.
Replace all `{{placeholder}}` values. Leave `applied:` and `follow_up:` blank.

---

```markdown
---
status: new
company: {{Company Name}}
role: {{Role Title}}
source: {{wellfound | web3.career | jobstash.xyz}}
url: {{https://...}}
discovered: {{YYYY-MM-DD}}
applied: 
score: {{0-100}}
salary_range: {{$XXk–$XXXk | not listed}}
domain: {{web3 | ai | other}}
follow_up: 
---

# {{Company Name}} — {{Role Title}}

## Match Breakdown

| Factor | Score | Notes |
|--------|-------|-------|
| Domain | {{X}}/40 | {{e.g. Web3/DeFi (+40)}} |
| Role | {{X}}/25 | {{e.g. Founding Engineer (+25)}} |
| Stack | {{X}}/20 | {{e.g. TypeScript, React, wagmi (+18)}} |
| Salary | {{X}}/15 | {{e.g. $140k listed (+15)}} |
| **Total** | **{{X}}/100** | |

## Job Description

> Source: {{url}}

{{Paste or summarize the full job description here. Include responsibilities,
requirements, tech stack, and any details about company/team/stage.}}

## Cover Letter Draft

---

{{Cover letter body here. 3–4 paragraphs. Direct, no filler openers.
Reference specific metrics. Sign off as Ivan K.}}

---

## Notes

<!-- Your personal notes, impressions, red flags, people to reach out to, etc. -->

## Timeline

- {{YYYY-MM-DD}}: Discovered via {{source}}
```

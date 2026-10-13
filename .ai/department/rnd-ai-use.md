<!-- Managed centrally by ai-context-structure. Do not edit: the next sync replaces this file. Project context belongs in .ai/project/ -->

# R&D AI Use Policy

`/policies/ai-use`, **active**: signed version 1.0 on 21 Sep 2026, in force from **6 Oct 2026**. R&D layer under `.ai/company/ai-usage-policy.md`; adds only, never relaxes. Delta only below.

Before 6 Oct 2026 this is ratified text that does not yet bind anyone, so do not cite it to block work. Build to it anyway: nothing shipped now should need reworking on the effective date.

Sections are 1 to 10 plus Annex A, rules nested under 4. Cite numbers only from the page: vibe-coded systems 4.5, AI Use Compliance review 4.8, risk tiers 4.10, registry 4.11. An earlier draft used a flat 0 to 16 numbering and those numbers are wrong. For exact wording, fetch the page (`get_page /policies/ai-use`, or append `.md` to the URL) rather than quoting this digest.

Approved: GitHub Copilot in-IDE; Claude and Gemini outside the IDE; the Handbook MCP server; OpenClaw; Cloudflare AI Gateway. Company accounts only. Cloudflare OS is explicitly not approved. Anything else needs approval first. Requests and questions go to `#ai-requests` on Discord; access to an already-approved tool is an access request, not a review.

## Development tool vs in-product
- A system shipped through the normal process (version control, code review, CI, security review, change management) is governed by those standards whether or not AI wrote the code. Copilot on a pull request does not create an Agent.
- That covers AI as a development tool only. A system that calls a model at run time, or sends company, client, or personal data through an AI service, is in scope in full.

## Vibe-coded and AI-assisted systems (4.5, 4.10)
- The test is the process, not the department. Skipped code review means in scope, including inside R&D.
- Reviewed before production or exposure to real users or real data: security (injection, secrets handling), data flows, error handling, maintainability.
- Company-managed infrastructure only. `eplayment-labs` is not an exemption.
- In production or with real data it is an Agent, as is an AI-assisted script others use or that touches company data.

## Approvals (4.10)
- R&D holds Technical Approval for every department. Not waivable by Business Approval, a department head, or the AI Enablement Task Force. Final authority: the CTO, who also gives Business Approval within R&D.
- Where the system owner sits in R&D, someone else reviews.
- An AI Use Compliance review is required before production or real data, on top of the technical review. R&D conducts it.
- DPO referral only on an escalation trigger: high-risk personal data, a new category or purpose, a new vendor or a transfer outside the Philippines, an automated decision materially affecting someone, or AI in a customer-facing payments decision. Otherwise R&D approves and records the basis in the registry.
- A DPO determination covers a category of personal data for a stated purpose, not one system. Later systems cite it; a new purpose, vendor, region, unmet condition, or materially larger volume needs a fresh referral.

## Real data in development (4.11)
The company's six conditions apply unchanged. On top of them, high-risk categories of personal data need the DPO first, at any volume. The blanket "DPO has agreed it" condition carried by the earlier draft is not in the signed text.

## Transition
Systems already in use on 6 Oct 2026 are registered by **5 Nov 2026** and reviewed by **4 Jan 2027**, counted from the effective date, not from signature. They keep running in the meantime unless a specific risk is found. Registering something unapproved is not a violation; using it unapproved is.

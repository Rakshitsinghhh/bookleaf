// BookLeaf Knowledge Base and Token-Efficient Policy Retrieval

export const BOOKLEAF_KNOWLEDGE_BASE = {
  overview: `
BookLeaf Publishing is a self-publishing company operating in India and the US.
We offer publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management for our authors.
In-house printing facility and warehouse are in Delhi. Print partners include Repro India and Epitome Books.
`,

  royaltyPolicy: `
ROYALTY POLICY:
- 80/20 royalty split: 80% of net profit goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: ₹1,000. Accumulated balances below ₹1,000 roll over to the next quarter.
- Payouts are made via bank transfer to the account linked in the author's dashboard.
- Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform.
`,

  isbnPolicy: `
ISBN POLICY:
- Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.
- ISBNs are registered under BookLeaf's publisher imprint. If an author wants an ISBN under their own imprint, they need to obtain it independently.
- If an author reports an ISBN error (duplicate, wrong book linked), it is treated as a high-priority issue and escalated to the production team with a 48-hour resolution timeline.
`,

  printingPolicy: `
PRINTING & QUALITY:
- In-house printing handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- If an author reports a quality issue (misprints, binding defects, color inconsistency), BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy.
`,

  distributionPolicy: `
DISTRIBUTION & AVAILABILITY:
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- If a book is showing as unavailable on a platform, it usually indicates a stock sync issue—BookLeaf's team can trigger a re-sync within 24–48 hours.
- Metadata updates can be submitted through the dashboard or by emailing the BookLeaf team; changes typically reflect within 3–5 business days.
`,

  productionPolicy: `
PRODUCTION STAGES:
- Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors are updated at each stage via email. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).
- Delays should be explained collaboratively without deflecting or blaming.
`,

  toneGuidelines: `
COMMUNICATION TONE GUIDELINES:
- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: include actual numbers, dates, and statuses wherever possible.
- If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.
- If the issue requires escalation or investigation, give a clear timeline (e.g. "Our team will look into this and get back to you within 48 hours").
- Always end with a clear next step for the author and/or the BookLeaf team.
`
};

/**
 * Token Optimization (Cost Awareness):
 * Instead of dumping the entire knowledge base on every query,
 * selectively retrieve the relevant sections based on query keywords.
 */
export function getRelevantKnowledgeContext(queryText) {
  const text = queryText.toLowerCase();
  const sections = [BOOKLEAF_KNOWLEDGE_BASE.overview, BOOKLEAF_KNOWLEDGE_BASE.toneGuidelines];

  if (/royalt|payment|payout|bank|money|earnings|sold|threshold|rupee|₹|commission/i.test(text)) {
    sections.push(BOOKLEAF_KNOWLEDGE_BASE.royaltyPolicy);
  }
  if (/isbn|barcode|imprint|metadata/i.test(text)) {
    sections.push(BOOKLEAF_KNOWLEDGE_BASE.isbnPolicy);
  }
  if (/print|paper|binding|defect|page|misprint|damage|copies|warehouse/i.test(text)) {
    sections.push(BOOKLEAF_KNOWLEDGE_BASE.printingPolicy);
  }
  if (/distribut|amazon|flipkart|availab|stock|store|listing|out of stock|sync|buy|channel|retail/i.test(text)) {
    sections.push(BOOKLEAF_KNOWLEDGE_BASE.distributionPolicy);
  }
  if (/stage|proof|cover|typeset|manuscript|delay|progress|edit|production/i.test(text)) {
    sections.push(BOOKLEAF_KNOWLEDGE_BASE.productionPolicy);
  }

  return sections.join('\n\n');
}


import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { BOOKLEAF_KNOWLEDGE_BASE } from "./knowledge-base.js";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;

if (!apiKey || !model) {
  throw new Error("Set GEMINI_API_KEY and GEMINI_MODEL in your .env file.");
}

const ai = new GoogleGenAI({ apiKey });

export const allowedCategories = [
  "Royalty & Payments",
  "ISBN & Metadata",
  "Printing & Quality",
  "Distribution",
  "Production Updates",
  "General",
];

const allowedPriorities = ["Critical", "High", "Medium", "Low"];

const responseSchema = {
  type: "OBJECT",
  properties: {
    category: {
      type: "STRING",
      enum: allowedCategories,
    },
    priority: {
      type: "STRING",
      enum: allowedPriorities,
    },
    reason: { type: "STRING" },
    replyDraft: { type: "STRING" },
    recommendedAction: { type: "STRING" },
  },
  required: [
    "category",
    "priority",
    "reason",
    "replyDraft",
    "recommendedAction",
  ],
};

export async function analyzeTicket(ticket) {
  if (!ticket?.subject?.trim() || !ticket?.description?.trim()) {
    throw new Error("Each ticket must have a subject and description.");
  }

  const prompt = `
${BOOKLEAF_KNOWLEDGE_BASE}

You are BookLeaf Publishing's AI support assistant.
Analyze this ticket using the knowledge base.

TICKET:
${JSON.stringify(ticket, null, 2)}

CATEGORY RULES:
- Royalty questions or missing payments: Royalty & Payments.
- Incorrect ISBN or metadata changes: ISBN & Metadata.
- Damaged or defective printed books: Printing & Quality.
- Distribution issues, retail availability, online listing, or stock-sync issues: Distribution.
- Delays in production stages: Production Updates.
- Other questions: General.

PRIORITY RULES:
- Choose Critical, High, Medium, or Low based on actual urgency.
- ISBN errors must be High priority and recommended for production escalation.
- Do not mark every complaint as Critical.
- Explain the selected priority.

POLICY RULES:
- Royalties are calculated quarterly and paid within 45 days after
  the quarter ends. Minimum payout is INR 1,000; smaller balances roll over.
- Printing turnaround is 5–7 business days. Verified printing defects
  qualify for a free reprint; photos may be requested.
- New listings generally appear 7–10 business days after publication.
  A stock-sync issue may take 24–48 hours to resolve after re-sync.
- Metadata changes take 3–5 business days.
- Production stages are: Manuscript Received, Editing (if opted),
  Cover Design, Typesetting, Proofreading, ISBN Assignment, Printing,
  Distribution Setup, Published & Live.

RESPONSE SAFETY:
- Be empathetic, professional, concise, and specific.
- Do not invent author details, book details, sales, balances, or dates.
- Four months since publication alone does not prove royalty payment
  is overdue.
- Do not claim an action has already happened unless confirmed by the app.
- Recommend actions; do not imply the AI has performed them.
- For ISBN errors, recommend production escalation and a 48-hour update target.
- For royalty issues, recommend checking the relevant quarter, balance,
  bank details, and payment records. Recommend finance escalation if
  records confirm a payment is overdue.
- For printing defects, explain that photos may be needed and a free
  reprint applies to verified defects.
- For unavailable listings, consider publication timing and stock sync.
- End the author-facing draft with a clear next step.
- Keep internal recommendations separate from the reply draft.

Return only an object matching the supplied JSON schema.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  let result;

  try {
    result = JSON.parse(response.text);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Gemini response must be a JSON object.");
  }

  if (!allowedCategories.includes(result.category)) {
    throw new Error(`Invalid category: ${result.category}`);
  }

  if (!allowedPriorities.includes(result.priority)) {
    throw new Error(`Invalid priority: ${result.priority}`);
  }

  for (const field of ["reason", "replyDraft", "recommendedAction"]) {
    if (typeof result[field] !== "string" || !result[field].trim()) {
      throw new Error(`Gemini returned an invalid ${field}.`);
    }
  }

  // Enforce the assignment's ISBN priority requirement.
  if (
    result.category === "ISBN & Metadata" &&
    /isbn/i.test(`${ticket.subject} ${ticket.description}`) &&
    result.priority !== "High"
  ) {
    throw new Error("ISBN-related ticket must be High priority.");
  }

  return result;
}

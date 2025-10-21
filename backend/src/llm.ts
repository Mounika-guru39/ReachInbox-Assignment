/**
 * LLM stubs: Replace these with real Gemini/OpenAI API calls.
 * - classifyEmail(text): returns one of the labels
 * - suggestReply(original, contexts): returns a string reply
 *
 * Current implementation: naive keyword based fallback to allow the flow to work without API keys.
 */

export async function classifyEmail(text: string) {
  const t = text.toLowerCase();
  if (t.includes("unsubscribe") || t.includes("buy now") || t.includes("spam")) return "Spam";
  if (t.includes("out of office") || t.includes("oof")) return "Out of Office";
  if (t.includes("interested") || t.includes("sounds good") || t.includes("pricing")) return "Interested";
  if (t.includes("meeting") || t.includes("schedule") || t.includes("calendly") || t.includes("book")) return "Meeting Booked";
  return "Not Interested";
}

export async function suggestReply(original: string, contexts: string[]) {
  // naive template reply that uses a sample meeting link from contexts if present
  const link = contexts.find(c=>c.includes("http")) || "https://cal.com/example";
  return `Thanks for reaching out. I'm available — please book a slot here: ${link}\n\n(Reply drafted by ReachInbox-Stub)`;
}

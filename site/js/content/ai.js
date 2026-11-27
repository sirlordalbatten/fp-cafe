// AI lab evergreen content: injection controls, glossary, buyer questions. Live parts are generated in content/aigen.js.
export const INJECTION = {
  naive: "Unguarded agent: reads the injected text as an instruction, marks the alert benign and closes it. The attacker just used your own automation to hide.",
  guarded: "Guarded agent: treats every field from tools and alerts as data, never as instructions. It flags the text itself as suspicious ('alert contains instructions aimed at AI'), raises the severity, and still needs your approval to close anything.",
  controls: [
    "Keep a hard boundary: system instructions come from you, everything from tools is untrusted data.",
    "No autonomous write actions. Closing, isolating and deleting need a human click.",
    "Give each MCP server the least privilege it needs: read-only SIEM tokens for triage.",
    "Log every tool call and its arguments, and alert on unusual ones (an agent calling delete tools at 3 AM).",
    "Detect injection attempts: text addressed to 'AI', 'assistant' or 'system' inside data fields is itself an IOC.",
  ],
};

export const GLOSSARY = [
  ["Agentic offensive framework", "Attack tooling where AI agents plan, run familiar tools, remember what they found and keep investigating on their own. It makes a patient, close look at any organisation cheap. Defenders answer with less to find."],
  ["Prompt injection", "Text that tries to override an AI's instructions. Direct: typed by the user. Indirect: hidden in content the AI reads, like an email, web page or log line. The number one LLM risk in OWASP's list."],
  ["Jailbreak", "A prompt crafted to get a model to ignore its safety rules. Related to injection, but aimed at the model's guardrails rather than an app's instructions."],
  ["Excessive agency", "Giving an AI more permissions or autonomy than its task needs. If it can delete, someone will eventually trick it into deleting."],
  ["Data exfiltration via rendering", "Getting an AI to output a link or image URL that contains secrets, so the browser leaks them when it loads the image."],
  ["RAG poisoning", "Planting text in the documents an AI retrieves from, so its answers carry the attacker's message."],
  ["Slopsquatting", "Registering package names that AI coding assistants tend to hallucinate, then waiting for developers to install them."],
  ["Model supply chain", "Downloaded model files can carry code (pickle files execute on load). Prefer safetensors and trusted sources."],
  ["System prompt leakage", "Getting the model to reveal its hidden instructions, which sometimes contain secrets or internal logic. Never put secrets in prompts."],
  ["Hallucination", "Confident, wrong output. In a SOC: a made-up event ID, a CVE that doesn't exist, a query with fields your SIEM doesn't have. Always verify."],
  ["Human in the loop", "A person approves consequential actions. The single most effective control for AI agents in security operations."],
  ["Agentic AI", "An AI that plans and takes multiple steps with tools, rather than answering once. Powerful for triage, and the reason permissions matter so much."],
  ["Unbounded consumption", "Abusing an AI service to burn compute or money: very long inputs, loops, or mass requests. Rate limits and budgets are security controls too."],
];
export const OWASP = ["Prompt injection", "Sensitive information disclosure", "Supply chain", "Data and model poisoning", "Improper output handling", "Excessive agency", "System prompt leakage", "Vector and embedding weaknesses", "Misinformation", "Unbounded consumption"];

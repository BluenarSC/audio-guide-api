// api/qa.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { question = "", city = {}, poi = {} } = req.body || {};

  // 0) Sprawdź widoczność klucza
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(200).json({
      answer: `DEMO (brak OPENAI_API_KEY w Production). Pytanie: ${question || "-"}. Miejsce: ${poi.title || "-"}.`
    });
  }

  // jeśli używasz klucza sk-proj- i masz ID projektu, możesz dodać OPENAI_PROJECT w Vercel
  const project = process.env.OPENAI_PROJECT || "";

  const context = `
Jesteś przewodnikiem. Odpowiadaj krótko po polsku i dodaj 1 ciekawostkę.
Miasto: ${city.name || "-"}.
Miejsce: ${poi.title || "-"}.
Fakty: ${(poi.base_facts || []).join(" ")}
Pytanie: ${question}`.trim();

  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    };
    if (project) headers["OpenAI-Project"] = project; // dla sk-proj-* bywa wymagane

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: context }],
        temperature: 0.6,
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      // TO zobaczysz w Vercel → Logs → Messages
      console.error("OpenAI error", r.status, j);
      return res.status(200).json({
        answer: `AI error ${r.status}: ${j?.error?.message || "unknown"}`,
      });
    }

    const answer =
      j?.choices?.[0]?.message?.content?.trim() || "Brak odpowiedzi AI.";
    return res.status(200).json({ answer });
  } catch (e) {
    console.error("AI fetch failed:", e);
    return res.status(200).json({ answer: "Problem z połączeniem z AI." });
  }
}

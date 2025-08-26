// api/qa.js — wersja darmowa na Groq (Llama 3.1)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { question = "", city = {}, poi = {} } = req.body || {};

  // 1) Zbuduj kontekst przewodnika
  const context = `
Jesteś przewodnikiem turystycznym. Odpowiadaj krótko po polsku i dodaj 1 ciekawostkę dla dzieci.
Miasto: ${city.name || "-"}.
Miejsce: ${poi.title || "-"}.
Fakty: ${(poi.base_facts || []).join(" ")}
Pytanie: ${question}`.trim();

  // 2) Klucz do Groq z Vercel (Settings → Environment Variables)
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(200).json({
      answer: "DEMO: brak GROQ_API_KEY w Production. Dodaj klucz w Vercel → Settings → Environment Variables."
    });
  }

  try {
    // Groq ma OpenAI-compatible endpoint
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // szybki i darmowy do testów
        messages: [{ role: "user", content: context }],
        temperature: 0.6,
        max_tokens: 300
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      console.error("Groq error", r.status, j);
      return res.status(200).json({
        answer: `AI error (Groq) ${r.status}: ${j?.error?.message || "unknown"}`
      });
    }

    const answer = j?.choices?.[0]?.message?.content?.trim() || "Brak odpowiedzi AI.";
    return res.status(200).json({ answer });
  } catch (e) {
    console.error("Groq fetch failed:", e);
    return res.status(200).json({ answer: "Problem z połączeniem z AI." });
  }
}

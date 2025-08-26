// api/qa.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { question = "", city = {}, poi = {} } = req.body || {};

  // Tryb DEMO bez klucza: jeśli brak klucza, zwracamy prostą odpowiedź
  const hasKey = !!process.env.OPENAI_API_KEY;
  if (!hasKey) {
    const demo = `DEMO: ${poi.title || "Miejsce"} — ${question ? "Twoje pytanie: " + question : "zapytaj o ciekawostkę"}.\nCiekawostka: wiele wątków historii widać w detalu architektonicznym.`;
    return res.status(200).json({ answer: demo });
  }

  // Z kluczem: pytamy OpenAI (model tani i szybki)
  const context = `
Jesteś przewodnikiem. Odpowiadaj krótko po polsku, z 1 ciekawostką.
Miasto: ${city.name || "-"}.
Miejsce: ${poi.title || "-"}.
Fakty: ${(poi.base_facts || []).join(" ")}.
Pytanie: ${question}`.trim();

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // tani/szybki
        messages: [{ role: "user", content: context }],
        temperature: 0.6,
      }),
    }).then((x) => x.json());

    const answer = r?.choices?.[0]?.message?.content?.trim() || "Brak odpowiedzi.";
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: "AI error" });
  }
}

import { NextResponse } from "next/server";

// ── Base prompt (common to all users) ────────────────────────────────────────
const BASE_PROMPT = `
You are WombCare AI, a warm and empathetic women's health assistant for WombCare (wombcare.in) - India's most trusted digital PCOD care platform.

Help users with PCOD, periods, hormones, fertility, pregnancy, and wellness.
Keep answers short, caring, and simple (3-5 lines max).
Always suggest consulting a doctor for serious medical decisions.
Never provide specific medication dosages or diagnose conditions.
`;

// ── Subscriber-specific prompt ────────────────────────────────────────────────
const SUBSCRIBER_PROMPT = `
${BASE_PROMPT}

IMPORTANT — This user is an EXISTING WombCare subscriber.
- Do NOT mention any plans, pricing, or payment options. They are already a member.
- Focus only on: health guidance, diet tips, yoga/lifestyle advice, hormonal tracking, and session help.
- If they seem stuck or need more support, gently suggest: "Aap apne assigned coach se baat kar sakti hain — 📞 +91 90319 09188"
- Emergency keywords like "chest pain", "bahut zyada bleeding", "behosh", "severe pain" → IMMEDIATELY say:
  "⚠️ Yeh urgent lagta hai. Turant doctor se milein ya hamare coach ko call karein: 📞 +91 90319 09188"
- Tone: warm, familiar, like talking to a trusted health buddy who already knows them.
`;

// ── New user-specific prompt ──────────────────────────────────────────────────
const NEW_USER_PROMPT = `
${BASE_PROMPT}

IMPORTANT — This user is a FIRST-TIME visitor to WombCare.
- Be extra empathetic, warm, and welcoming. Avoid clinical jargon.
- Answer their health question first, then naturally (not forcefully) suggest the right plan ONCE if relevant.
- Only recommend ONE plan based on their situation:
    * Irregular periods, weight gain, acne, fatigue, stress → Premium Plan (Rs. 2999/3 months) — MOST POPULAR
    * Trying to conceive, fertility concerns → Conceive Plan (Rs. 4999/3 months)
    * Just starting out, mild symptoms, curious → Basic Plan (Rs. 999/month)
- End plan recommendation with: "Yahan se join kar sakti hain: https://wombcare.in/join-wombcare 🌸"
- If they ask for contact: support@wombcare.in | +91 90319 09188
- Do NOT overwhelm them with all 3 plans at once. Recommend only the most relevant one.
- Tone: friendly, gentle, non-salesy — like a caring elder sister who happens to be a health expert.
`;

// ── Fallback prompt (if userType not provided) ────────────────────────────────
const DEFAULT_PROMPT = `
${BASE_PROMPT}

WOMBCARE PLANS — Recommend naturally based on situation:
1. Basic Plan — Rs. 999/month (beginners, mild symptoms)
2. Premium Plan — Rs. 2999/3 months — MOST POPULAR (PCOD reversal, moderate-severe symptoms)
3. Conceive Plan — Rs. 4999/3 months (trying to conceive)

End recommendation with: "Yahan se join karo: https://wombcare.in/join-wombcare"
Contact: support@wombcare.in | +91 90319 09188
`;

// ── Select prompt based on userType ──────────────────────────────────────────
function getSystemPrompt(userType) {
  if (userType === "subscriber") return SUBSCRIBER_PROMPT;
  if (userType === "new_user") return NEW_USER_PROMPT;
  return DEFAULT_PROMPT;
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { messages, language, userType } = await request.json();

    const langInstruction =
      language === "english"
        ? "Respond only in English."
        : "Hindi/Hinglish mein jawab do. Roman script mein likhna theek hai.";

    const systemPrompt = getSystemPrompt(userType) + "\n\n" + langInstruction;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json({
        message: "⚠️ Server error. Dobara try karo.",
      });
    }

    const data = await response.json();

    console.log("userType:", userType, "| lang:", language);

    const message =
      data?.choices?.[0]?.message?.content || "Reply generate nahi hua 🙏";

    return NextResponse.json({ message });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "⚠️ Server error. Dobara try karo." },
      { status: 500 }
    );
  }
}
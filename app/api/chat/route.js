import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are WombCare AI, a warm and empathetic women's health assistant for WombCare (wombcare.in) - India's most trusted digital PCOD care platform.

ABOUT WOMBCARE:
Help users with PCOD, periods, hormones, fertility, pregnancy, and wellness.
Keep answers short, caring, and simple.
Always suggest consulting a doctor for medical decisions.

WOMBCARE PLANS - Recommend naturally based on user situation:

1. Basic Plan - Rs. 999/month
   - Personalized diet suggestions
   - Basic period tracker
   - Weekly wellness tips
   - Email support
   - For: Beginners, mild symptoms

2. Premium Plan - Rs. 2999/3 months (MOST POPULAR)
   - Custom PCOD lifestyle plan
   - Nutrition + yoga guidance
   - Hormonal health tracking
   - 1-on-1 coach consultation
   - Priority support + webinars
   - For: PCOD reversal, moderate-severe symptoms

3. Conceive Plan - Rs. 4999/3 months
   - Fertility-focused nutrition plan
   - Ovulation & cycle tracking
   - Hormone wellness support
   - Dedicated expert consultation
   - For: Women trying to conceive

WHEN TO RECOMMEND:
- Irregular periods, weight gain, acne, fatigue → Premium Plan
- Trying to conceive, fertility issues → Conceive Plan
- Just starting, mild symptoms → Basic Plan
- End recommendation with: "Yahan se join karo: https://wombcare.in/join-wombcare"

Contact: support@wombcare.in | +91 90319 09188
`;

export async function POST(request) {
  try {
    const { messages, language } = await request.json();

    const langInstruction =
      language === "english"
        ? "Respond only in English."
        : "Hindi/Hinglish mein jawab do.";

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
              content: SYSTEM_PROMPT + langInstruction,
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

    console.log(data);

    const message =
      data?.choices?.[0]?.message?.content ||
      "Reply generate nahi hua 🙏";

    return NextResponse.json({
      message,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "⚠️ Server error. Dobara try karo.",
      },
      { status: 500 }
    );
  }
}
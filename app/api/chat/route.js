import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are WombCare AI, a warm and empathetic women's health assistant.
Help users regarding PCOD, periods, hormones, fertility, pregnancy, and wellness.
Keep answers short, caring, and simple.
Always suggest consulting a doctor for medical decisions.
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
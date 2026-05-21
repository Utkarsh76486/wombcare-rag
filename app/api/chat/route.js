import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Frontend se data lo
    const { messages, language } = await request.json();

    // Latest user message
    const latestMessage =
      messages[messages.length - 1]?.content || "";

    // Language instruction
    const languageInstruction =
      language === "english"
        ? " Please respond only in English."
        : " Kripya sirf Hindi/Hinglish mein jawab dein.";

    // Final query
    const queryWithLanguage =
      latestMessage + languageInstruction;

    console.log("Sending Query:", queryWithLanguage);

    // FASTAPI BACKEND CALL
    const response = await fetch(
      "https://wombcare-rag.onrender.com/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: queryWithLanguage,
            },
          ],

          language,
        }),

        cache: "no-store",
      }
    );

    console.log("Backend Status:", response.status);

    // Agar backend fail hua
    if (!response.ok) {
      throw new Error(
        `Backend Error: ${response.status}`
      );
    }

    // Backend response parse
    const data = await response.json();

    console.log("Backend Response:", data);

    // Frontend ko response bhejo
    return NextResponse.json({
      message:
        data.response ||
        data.message ||
        "No response received",
    });

  } catch (error) {
    console.error("FULL API ERROR:", error);

    return NextResponse.json(
      {
        message:
          "⚠️ Backend wake ho raha hai ya temporary issue hai. 20-30 sec baad dobara try karo 🙏",
      },
      { status: 500 }
    );
  }
}
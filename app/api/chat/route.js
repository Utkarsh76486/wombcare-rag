import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages, language } = await request.json();

    const latestMessage = messages[messages.length - 1]?.content || "";

    // Build language instruction to append to the query
    const languageInstruction =
      language === "english"
        ? " (Please respond only in English.)"
        : " (Kripya sirf Hindi mein jawab dein.)";

    const queryWithLanguage = latestMessage + languageInstruction;

    // FASTAPI BACKEND CALL
    const response = await fetch(
      `https://wombcare-rag.onrender.com/chat?query=${encodeURIComponent(queryWithLanguage)}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    return NextResponse.json({
      message: data.response,
    });

  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        message: "⚠️ Server issue hai. Dobara try karo 🙏",
      },
      { status: 500 }
    );
  }
}
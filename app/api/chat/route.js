import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages } = await request.json();

    const latestMessage =
      messages[messages.length - 1]?.content || "";

    // FASTAPI BACKEND CALL
    const response = await fetch(
      `http://127.0.0.1:8000/chat?query=${encodeURIComponent(latestMessage)}`,
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
        message:
          "⚠️ Server issue hai. Dobara try karo 🙏",
      },
      { status: 500 }
    );
  }
}
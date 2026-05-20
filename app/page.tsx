"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "PCOD kya hota hai? 🌸",
  "Periods late kyun hote hain?",
  "Pregnancy ke pehle kya karna chahiye?",
  "Hormones balance kaise karein?",
  "PCOS mein kya khayein?",
  "Irregular periods normal hai?",
];

export default function WombCare() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || data.error || "Kuch problem aa gayi. Please dobara try karein. 🙏",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network issue lag raha hai. Please dobara try karein. 🙏",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --rose: #C2185B;
          --rose-light: #E91E8C;
          --rose-pale: #FCE4EC;
          --rose-blush: #FFF0F5;
          --mauve: #8E3A59;
          --cream: #FFF8F9;
          --text-dark: #1A0A12;
          --text-mid: #5C2D44;
          --text-soft: #9E6E80;
          --border: rgba(194,24,91,0.12);
          --shadow-rose: 0 8px 32px rgba(194,24,91,0.15);
          --gradient-hero: linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 40%, #FFF8F9 100%);
        }

        html, body { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--text-dark); }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 780px;
          margin: 0 auto;
          position: relative;
        }

        /* HEADER */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,248,249,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-ring {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(194,24,91,0.35);
          animation: pulse-logo 3s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 4px 14px rgba(194,24,91,0.35); }
          50% { box-shadow: 0 4px 22px rgba(194,24,91,0.55); }
        }

        .brand-text h1 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--rose);
          letter-spacing: -0.3px;
          line-height: 1;
        }

        .brand-text p {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-soft);
          font-weight: 500;
          margin-top: 2px;
        }

        .status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-soft);
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4CAF50;
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .clear-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text-soft);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .clear-btn:hover {
          border-color: var(--rose);
          color: var(--rose);
          background: var(--rose-blush);
        }

        /* MAIN CONTENT */
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 20px 120px;
          scroll-behavior: smooth;
        }

        .chat-area::-webkit-scrollbar { width: 4px; }
        .chat-area::-webkit-scrollbar-track { background: transparent; }
        .chat-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        /* WELCOME SCREEN */
        .welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 20px 32px;
          text-align: center;
          animation: fadeUp 0.6s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .welcome-orb {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 20px 60px rgba(194,24,91,0.3), 0 0 0 12px rgba(194,24,91,0.07), 0 0 0 24px rgba(194,24,91,0.03);
          animation: float 4s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .welcome h2 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .welcome h2 em {
          font-style: italic;
          color: var(--rose);
        }

        .welcome p {
          font-size: 15px;
          color: var(--text-soft);
          max-width: 380px;
          line-height: 1.7;
          margin-bottom: 8px;
        }

        .lang-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--rose-pale);
          border-radius: 20px;
          font-size: 12px;
          color: var(--mauve);
          font-weight: 500;
          margin-top: 8px;
        }

        .quick-section {
          width: 100%;
          margin-top: 36px;
        }

        .quick-section h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-soft);
          margin-bottom: 14px;
          text-align: center;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .quick-chip {
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: white;
          color: var(--text-mid);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s;
          text-align: left;
          line-height: 1.4;
          box-shadow: 0 2px 8px rgba(194,24,91,0.05);
        }

        .quick-chip:hover {
          border-color: var(--rose);
          background: var(--rose-blush);
          color: var(--rose);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(194,24,91,0.15);
        }

        /* MESSAGES */
        .message-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeUp 0.4s ease;
        }

        .msg {
          display: flex;
          gap: 12px;
          max-width: 88%;
        }

        .msg.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .msg.assistant {
          align-self: flex-start;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          align-self: flex-end;
          overflow: hidden;
        }

        .avatar.bot {
          background: white;
          box-shadow: 0 4px 12px rgba(194,24,91,0.3);
          border: 1.5px solid var(--border);
        }

        .avatar.user-av {
          background: linear-gradient(135deg, var(--mauve), #9C27B0);
          font-size: 14px;
          color: white;
          font-weight: 600;
        }

        .bubble {
          padding: 14px 18px;
          border-radius: 20px;
          font-size: 14.5px;
          line-height: 1.65;
          position: relative;
        }

        .bubble.user {
          background: linear-gradient(135deg, var(--rose), var(--rose-light));
          color: white;
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 16px rgba(194,24,91,0.25);
        }

        .bubble.assistant {
          background: white;
          color: var(--text-dark);
          border-bottom-left-radius: 6px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 12px rgba(194,24,91,0.07);
        }

        .msg-time {
          font-size: 10px;
          color: var(--text-soft);
          margin-top: 4px;
          opacity: 0.7;
          text-align: right;
        }

        .msg.assistant .msg-time {
          text-align: left;
        }

        /* TYPING INDICATOR */
        .typing-bubble {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          border-bottom-left-radius: 6px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 12px rgba(194,24,91,0.07);
        }

        .typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--rose);
          opacity: 0.4;
          animation: typing 1.2s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }

        /* INPUT AREA */
        .input-area {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 780px;
          padding: 12px 20px 20px;
          background: linear-gradient(to top, var(--cream) 85%, transparent);
        }

        .disclaimer {
          text-align: center;
          font-size: 10px;
          color: var(--text-soft);
          margin-bottom: 10px;
          opacity: 0.7;
        }

        .disclaimer span { color: var(--rose); font-weight: 500; }

        .input-box {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 24px;
          padding: 10px 10px 10px 18px;
          box-shadow: 0 8px 32px rgba(194,24,91,0.1), 0 0 0 4px rgba(194,24,91,0.04);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-box:focus-within {
          border-color: var(--rose);
          box-shadow: 0 8px 32px rgba(194,24,91,0.18), 0 0 0 4px rgba(194,24,91,0.07);
        }

        .input-box textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          color: var(--text-dark);
          background: transparent;
          line-height: 1.5;
          max-height: 120px;
          min-height: 24px;
          padding: 2px 0;
        }

        .input-box textarea::placeholder { color: var(--text-soft); opacity: 0.7; }

        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, var(--rose), var(--rose-light));
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(194,24,91,0.35);
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.08) rotate(-15deg);
          box-shadow: 0 6px 20px rgba(194,24,91,0.5);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .send-btn.loading {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }

        /* DIVIDER */
        .date-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .date-divider::before, .date-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .date-divider span {
          font-size: 11px;
          color: var(--text-soft);
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .quick-grid { grid-template-columns: 1fr; }
          .welcome h2 { font-size: 26px; }
          .msg { max-width: 95%; }
        }
      `}</style>

      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-brand">
            {/* ✅ CHANGED: logo-ring now shows logo.png instead of gradient + emoji */}
            <div className="logo-ring">
              <Image
                src="/logo.png"
                alt="WombCare Logo"
                width={44}
                height={44}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
            <div className="brand-text">
              <h1>WombCare</h1>
              <p>Women's Health Guide</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="status-dot">
              <div className="dot" />
              Online
            </div>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={clearChat}>
                ↺ Clear
              </button>
            )}
          </div>
        </header>

        {/* CHAT AREA */}
        <main className="chat-area">
          {showWelcome && messages.length === 0 && (
            <div className="welcome">
              {/* ✅ CHANGED: welcome-orb now shows logo.png instead of 🌸 emoji */}
              <div className="welcome-orb">
                <Image
                  src="/logo.png"
                  alt="WombCare Logo"
                  width={96}
                  height={96}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <h2>
                Namaste! Main hoon
                <br />
                <em>WombCare</em>
              </h2>
              <p>
                Aapki women's health ke baare mein koi bhi sawaal poochh sakti hain — PCOD, periods, pregnancy, ya hormones ke baare mein.
              </p>
              <div className="lang-badge">
                💬 Hindi · Hinglish · English — sab chalega!
              </div>

              <div className="quick-section">
                <h3>Kuch common sawaal</h3>
                <div className="quick-grid">
                  {QUICK_QUESTIONS.map((q) => (
                    <button key={q} className="quick-chip" onClick={() => sendMessage(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="date-divider">
              <span>Aaj ki baatcheet</span>
            </div>
          )}

          <div className="message-group">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <div className={`avatar ${msg.role === "assistant" ? "bot" : "user-av"}`}>
                  {/* ✅ CHANGED: bot avatar now shows logo.png instead of 🌸 emoji */}
                  {msg.role === "assistant" ? (
                    <Image
                      src="/logo.png"
                      alt="WombCare"
                      width={34}
                      height={34}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  ) : (
                    "🙂"
                  )}
                </div>
                <div>
                  <div className={`bubble ${msg.role === "user" ? "user" : "assistant"}`}>
                    {msg.content}
                  </div>
                  <div className="msg-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="msg assistant">
                {/* ✅ CHANGED: typing indicator avatar also uses logo.png */}
                <div className="avatar bot">
                  <Image
                    src="/logo.png"
                    alt="WombCare"
                    width={34}
                    height={34}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
      <div className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </main>

        {/* INPUT AREA */}
        <div className="input-area">
          <p className="disclaimer">
            <span>ℹ️ Sirf educational information.</span> Medical decision ke liye doctor se zaroor milein.
          </p>
          <div className="input-box">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Sawaal likhein… (Hindi / English)"
              rows={1}
            />
            <button
              className={`send-btn ${isLoading ? "loading" : ""}`}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? "⟳" : "↑"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
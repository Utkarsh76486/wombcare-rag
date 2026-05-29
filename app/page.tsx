"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  showFeedback?: boolean;
  feedbackGiven?: "yes" | "no" | null;
  isEscalation?: boolean;
}

type Language = "hindi" | "english" | null;
type UserType = "subscriber" | "new_user" | null;

// ── Subscriber quick questions ─────────────────────────────────────────────
const SUBSCRIBER_QUESTIONS_HINDI = [
  "Session miss ho gaya 😔",
  "Diet plan access karna hai 🥗",
  "Health se related sawaal hai 🌸",
  "Coach se milna chahti hoon 👩‍⚕️",
  "Mera period track karna hai 📅",
  "Yoga session kab hai? 🧘‍♀️",
];

const SUBSCRIBER_QUESTIONS_ENGLISH = [
  "I missed my session 😔",
  "I want to access my diet plan 🥗",
  "I have a health question 🌸",
  "I want to connect with my coach 👩‍⚕️",
  "I want to track my period 📅",
  "When is my yoga session? 🧘‍♀️",
];

// ── New user quick questions ───────────────────────────────────────────────
const NEW_USER_QUESTIONS_HINDI = [
  "WombCare ke baare mein batao 🌸",
  "WombCare join kyun karein? 💖",
  "PCOD kya hota hai? 🤔",
  "Kya PCOD theek ho sakta hai? ✨",
  "Mere liye kaunsa plan sahi hai?",
  "Irregular periods normal hai?",
];

const NEW_USER_QUESTIONS_ENGLISH = [
  "Tell me about WombCare 🌸",
  "Why should I join WombCare? 💖",
  "What is PCOD? 🤔",
  "Can PCOD be cured? ✨",
  "Which plan is right for me?",
  "Are irregular periods normal?",
];

// Emergency / escalation keywords
const ESCALATION_KEYWORDS_HI = [
  "bahut zyada bleeding",
  "chest pain",
  "seene mein dard",
  "behosh",
  "chakkar aa raha",
  "bahut dard",
  "emergency",
  "hospital",
  "ambulance",
  "blood bahut",
];
const ESCALATION_KEYWORDS_EN = [
  "chest pain",
  "heavy bleeding",
  "fainted",
  "unconscious",
  "severe pain",
  "emergency",
  "hospital",
  "ambulance",
  "too much blood",
  "can't breathe",
];

function checkEscalation(text: string, lang: Language): boolean {
  const lower = text.toLowerCase();
  const keywords =
    lang === "english" ? ESCALATION_KEYWORDS_EN : ESCALATION_KEYWORDS_HI;
  return keywords.some((kw) => lower.includes(kw));
}

export default function WombCare() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [language, setLanguage] = useState<Language>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const QUICK_QUESTIONS = (() => {
    if (userType === "subscriber") {
      return language === "english"
        ? SUBSCRIBER_QUESTIONS_ENGLISH
        : SUBSCRIBER_QUESTIONS_HINDI;
    }
    return language === "english"
      ? NEW_USER_QUESTIONS_ENGLISH
      : NEW_USER_QUESTIONS_HINDI;
  })();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // ── Jab language select ho, pehla bot message dikhao ──────────────────────
  useEffect(() => {
    if (language && userType === null && messages.length === 0) {
      const welcomeMsg: Message = {
        role: "assistant",
        content:
          language === "hindi"
            ? "Namaste! 🌸 Main WombCare AI hoon. Pehle bataiye — aap humari existing subscriber hain ya pehli baar aa rahi hain?"
            : "Hello! 🌸 I'm WombCare AI. First, please tell me — are you an existing WombCare subscriber, or are you visiting for the first time?",
        timestamp: new Date(),
        showFeedback: false,
      };
      setMessages([welcomeMsg]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // ── Speak assistant response ──────────────────────────────────────────────
  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "english" ? "en-IN" : "hi-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // ── Voice input ───────────────────────────────────────────────────────────
  const startListening = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(
        language === "english"
          ? "Voice not supported in this browser. Please use Chrome."
          : "Is browser mein voice support nahi hai. Chrome use karein."
      );
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognitionRef.current = recognition;
    recognition.lang = language === "english" ? "en-IN" : "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── User type select karo ─────────────────────────────────────────────────
  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setShowWelcome(true); // keep true so quick chips show below

    const userChoiceText =
      type === "subscriber"
        ? language === "hindi"
          ? "Main ek existing subscriber hoon 🌸"
          : "I am an existing subscriber 🌸"
        : language === "hindi"
        ? "Main pehli baar aa rahi hoon"
        : "I am visiting for the first time";

    const userMsg: Message = {
      role: "user",
      content: userChoiceText,
      timestamp: new Date(),
    };

    const botReply: Message = {
      role: "assistant",
      content:
        type === "subscriber"
          ? language === "hindi"
            ? "Bahut achha! 💖 WombCare family mein aapka swagat hai! Aaj main aapki kya madad kar sakti hoon — diet, yoga, hormones, ya coach se milna chahti hain?"
            : "Welcome back! 💖 So glad to have you in the WombCare family! How can I help you today — diet, yoga, hormones, or would you like to connect with your coach?"
          : language === "hindi"
          ? "Namaste! 🌸 WombCare mein aapka swagat hai! Aap apne PCOD, periods ya hormones ke baare mein poochh sakti hain — main yahan hoon aapki madad ke liye."
          : "Welcome to WombCare! 🌸 Feel free to ask me anything about PCOD, periods, or hormonal health — I'm here to help you.",
      timestamp: new Date(),
      showFeedback: false,
    };

    setMessages((prev) => [...prev, userMsg, botReply]);
  };

  // ── Feedback handle ───────────────────────────────────────────────────────
  const handleFeedback = (msgIndex: number, feedback: "yes" | "no") => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIndex) return m;
        if (feedback === "no") {
          // Escalation message add karo
          setTimeout(() => {
            const escalationMsg: Message = {
              role: "assistant",
              content:
                language === "hindi"
                  ? "Koi baat nahi 🙏 Aapki poori madad karna chahti hoon. Aap seedha hamare expert coach se baat kar sakti hain:\n📞 +91 90319 09188\n📧 support@wombcare.in\nYa aap apna sawaal dobara poochh sakti hain — main aur clearly jawab dene ki koshish karungi! 💖"
                  : "I'm sorry the response wasn't helpful 🙏 You can directly speak with our expert coach:\n📞 +91 90319 09188\n📧 support@wombcare.in\nOr feel free to ask your question again — I'll try to answer more clearly! 💖",
              timestamp: new Date(),
              showFeedback: false,
              isEscalation: true,
            };
            setMessages((prev2) => [...prev2, escalationMsg]);
          }, 300);
        }
        return { ...m, feedbackGiven: feedback };
      })
    );
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const isEscalationNeeded = checkEscalation(text, language);

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    // Emergency escalation — seedha show karo, API call mat karo
    if (isEscalationNeeded) {
      setIsLoading(false);
      const escalationMsg: Message = {
        role: "assistant",
        content:
          language === "hindi"
            ? "⚠️ Yeh ek urgent situation lagti hai. Kripya turant doctor se milein ya humare expert coach ko call karein:\n📞 +91 90319 09188\n📧 support@wombcare.in\nAapki sehat sabse pehle hai! 💖"
            : "⚠️ This sounds like an urgent situation. Please consult a doctor immediately or call our expert coach:\n📞 +91 90319 09188\n📧 support@wombcare.in\nYour health comes first! 💖",
        timestamp: new Date(),
        showFeedback: false,
        isEscalation: true,
      };
      setMessages((prev) => [...prev, escalationMsg]);
      return;
    }

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, language, userType }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.message ||
          data.error ||
          (language === "english"
            ? "Something went wrong. Please try again. 🙏"
            : "Kuch problem aa gayi. Please dobara try karein. 🙏"),
        timestamp: new Date(),
        showFeedback: true,
        feedbackGiven: null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(assistantMessage.content);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "english"
              ? "Network issue detected. Please try again. 🙏"
              : "Network issue lag raha hai. Please dobara try karein. 🙏",
          timestamp: new Date(),
          showFeedback: false,
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
    stopSpeaking();
    setMessages([]);
    setShowWelcome(true);
    setLanguage(null);
    setUserType(null);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  // ── Render ────────────────────────────────────────────────────────────────
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

        /* ── Header ── */
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

        .header-brand { display: flex; align-items: center; gap: 14px; }

        .logo-ring {
          width: 44px; height: 44px;
          border-radius: 50%; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(194,24,91,0.35);
          animation: pulse-logo 3s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 4px 14px rgba(194,24,91,0.35); }
          50%       { box-shadow: 0 4px 22px rgba(194,24,91,0.55); }
        }

        .brand-text h1 {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 600;
          color: var(--rose); letter-spacing: -0.3px; line-height: 1;
        }

        .brand-text p {
          font-size: 10px; text-transform: uppercase;
          letter-spacing: 2px; color: var(--text-soft);
          font-weight: 500; margin-top: 2px;
        }

        .status-dot { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-soft); }

        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4CAF50;
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .clear-btn {
          padding: 8px 16px; border-radius: 20px;
          border: 1px solid var(--border); background: white;
          color: var(--text-soft);
          font-family: 'DM Sans', sans-serif; font-size: 12px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 5px;
        }
        .clear-btn:hover { border-color: var(--rose); color: var(--rose); background: var(--rose-blush); }

        /* ── Chat area ── */
        .chat-area {
          flex: 1; overflow-y: auto;
          padding: 24px 20px 140px;
          scroll-behavior: smooth;
        }
        .chat-area::-webkit-scrollbar { width: 4px; }
        .chat-area::-webkit-scrollbar-track { background: transparent; }
        .chat-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        /* ── Welcome ── */
        .welcome {
          display: flex; flex-direction: column;
          align-items: center; padding: 48px 20px 32px;
          text-align: center;
          animation: fadeUp 0.6s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .welcome-orb {
          width: 96px; height: 96px; border-radius: 50%; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 20px 60px rgba(194,24,91,0.3),
                      0 0 0 12px rgba(194,24,91,0.07),
                      0 0 0 24px rgba(194,24,91,0.03);
          animation: float 4s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        .welcome h2 {
          font-family: 'Playfair Display', serif;
          font-size: 32px; font-weight: 600;
          color: var(--text-dark); margin-bottom: 12px; line-height: 1.2;
        }
        .welcome h2 em { font-style: italic; color: var(--rose); }

        .welcome p { font-size: 15px; color: var(--text-soft); max-width: 380px; line-height: 1.7; margin-bottom: 8px; }

        .lang-select-label {
          font-size: 13px; color: var(--text-soft);
          margin-top: 28px; margin-bottom: 14px;
          font-weight: 500; letter-spacing: 0.3px;
        }

        .lang-buttons { display: flex; gap: 14px; justify-content: center; }

        .lang-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 28px; border-radius: 18px;
          border: 2px solid var(--border); background: white;
          color: var(--text-mid);
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          cursor: pointer; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(194,24,91,0.07);
          min-width: 140px; justify-content: center;
        }
        .lang-btn:hover {
          border-color: var(--rose); background: var(--rose-blush); color: var(--rose);
          transform: translateY(-3px); box-shadow: 0 8px 24px rgba(194,24,91,0.18);
        }
        .lang-btn .flag { font-size: 22px; line-height: 1; }

        .lang-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; background: var(--rose-pale);
          border-radius: 20px; font-size: 12px;
          color: var(--mauve); font-weight: 500; margin-top: 8px;
        }

        .quick-section { width: 100%; margin-top: 36px; }
        .quick-section h3 {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 2px; color: var(--text-soft);
          margin-bottom: 14px; text-align: center;
        }

        .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .quick-chip {
          padding: 12px 16px; border-radius: 14px;
          border: 1.5px solid var(--border); background: white;
          color: var(--text-mid);
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          cursor: pointer; transition: all 0.25s;
          text-align: left; line-height: 1.4;
          box-shadow: 0 2px 8px rgba(194,24,91,0.05);
        }
        .quick-chip:hover {
          border-color: var(--rose); background: var(--rose-blush); color: var(--rose);
          transform: translateY(-2px); box-shadow: 0 6px 20px rgba(194,24,91,0.15);
        }

        /* ── Inline quick chips (below welcome-back message) ── */
        .quick-chips-inline {
          margin-top: 14px;
          width: 100%;
          animation: fadeUp 0.4s ease;
        }
        .chips-heading {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 1.5px; color: var(--text-soft);
          margin-bottom: 10px; font-weight: 500;
        }

        /* ── User type buttons ── */
        .user-type-btns {
          display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap;
        }

        .user-type-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px; border-radius: 16px;
          border: 2px solid var(--border); background: white;
          color: var(--text-mid);
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(194,24,91,0.06);
        }
        .user-type-btn:hover {
          border-color: var(--rose); background: var(--rose-blush); color: var(--rose);
          transform: translateY(-2px); box-shadow: 0 6px 18px rgba(194,24,91,0.16);
        }

        /* ── Messages ── */
        .message-group { display: flex; flex-direction: column; gap: 16px; animation: fadeUp 0.4s ease; }

        .msg { display: flex; gap: 12px; max-width: 88%; }
        .msg.user      { align-self: flex-end; flex-direction: row-reverse; }
        .msg.assistant { align-self: flex-start; }

        .avatar {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; align-self: flex-end; overflow: hidden;
        }
        .avatar.bot      { background: white; box-shadow: 0 4px 12px rgba(194,24,91,0.3); border: 1.5px solid var(--border); }
        .avatar.user-av  { background: linear-gradient(135deg, var(--mauve), #9C27B0); font-size: 14px; color: white; font-weight: 600; }

        .bubble { padding: 14px 18px; border-radius: 20px; font-size: 14.5px; line-height: 1.65; position: relative; white-space: pre-line; }

        .bubble.user {
          background: linear-gradient(135deg, var(--rose), var(--rose-light));
          color: white; border-bottom-right-radius: 6px;
          box-shadow: 0 4px 16px rgba(194,24,91,0.25);
        }
        .bubble.assistant {
          background: white; color: var(--text-dark);
          border-bottom-left-radius: 6px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 12px rgba(194,24,91,0.07);
        }
        .bubble.escalation {
          background: #FFF3E0;
          border-color: #FF9800;
          border-width: 1.5px;
        }

        .msg-time { font-size: 10px; color: var(--text-soft); margin-top: 4px; opacity: 0.7; text-align: right; }
        .msg.assistant .msg-time { text-align: left; }

        /* ── Feedback row ── */
        .feedback-row {
          display: flex; align-items: center; gap: 8px;
          margin-top: 6px; animation: fadeUp 0.3s ease;
        }
        .feedback-label {
          font-size: 11px; color: var(--text-soft);
        }
        .feedback-btn {
          padding: 4px 12px; border-radius: 12px; border: 1.5px solid var(--border);
          background: white; font-size: 12px; color: var(--text-mid);
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; gap: 4px;
        }
        .feedback-btn.yes:hover { border-color: #4CAF50; background: #F1F8E9; color: #388E3C; }
        .feedback-btn.no:hover  { border-color: var(--rose); background: var(--rose-blush); color: var(--rose); }
        .feedback-btn.active-yes { border-color: #4CAF50; background: #F1F8E9; color: #388E3C; }
        .feedback-btn.active-no  { border-color: var(--rose); background: var(--rose-blush); color: var(--rose); }
        .feedback-thanks { font-size: 11px; color: var(--text-soft); font-style: italic; }

        /* ── Typing ── */
        .typing-bubble {
          background: white; border: 1px solid var(--border);
          border-radius: 20px; border-bottom-left-radius: 6px;
          padding: 16px 20px;
          display: flex; align-items: center; gap: 5px;
          box-shadow: 0 2px 12px rgba(194,24,91,0.07);
        }
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--rose); opacity: 0.4;
          animation: typing 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50%       { opacity: 1;   transform: translateY(-4px); }
        }

        /* ── Input area ── */
        .input-area {
          position: fixed; bottom: 0;
          left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 780px;
          padding: 12px 20px 20px;
          background: linear-gradient(to top, var(--cream) 85%, transparent);
        }

        .disclaimer {
          text-align: center; font-size: 10px;
          color: var(--text-soft); margin-bottom: 10px; opacity: 0.7;
        }
        .disclaimer span { color: var(--rose); font-weight: 500; }

        .input-box {
          display: flex; align-items: flex-end; gap: 10px;
          background: white;
          border: 1.5px solid var(--border); border-radius: 24px;
          padding: 10px 10px 10px 18px;
          box-shadow: 0 8px 32px rgba(194,24,91,0.1), 0 0 0 4px rgba(194,24,91,0.04);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-box:focus-within {
          border-color: var(--rose);
          box-shadow: 0 8px 32px rgba(194,24,91,0.18), 0 0 0 4px rgba(194,24,91,0.07);
        }

        .input-box textarea {
          flex: 1; border: none; outline: none; resize: none;
          font-family: 'DM Sans', sans-serif; font-size: 14.5px;
          color: var(--text-dark); background: transparent;
          line-height: 1.5; max-height: 120px; min-height: 24px; padding: 2px 0;
        }
        .input-box textarea::placeholder { color: var(--text-soft); opacity: 0.7; }

        .mic-btn {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: var(--rose-pale); color: var(--rose);
          font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s; flex-shrink: 0;
        }
        .mic-btn:hover { background: var(--rose-blush); transform: scale(1.08); }
        .mic-btn.listening {
          background: var(--rose); color: white;
          animation: mic-pulse 1s ease-in-out infinite;
        }

        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(194,24,91,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(194,24,91,0); }
        }

        .send-btn {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, var(--rose), var(--rose-light));
          color: white; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(194,24,91,0.35);
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 6px 20px rgba(194,24,91,0.5); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .speak-btn {
          background: none; border: none; cursor: pointer;
          font-size: 13px; color: var(--text-soft);
          padding: 4px 0 0 0;
          display: inline-flex; align-items: center; gap: 4px;
          opacity: 0.6; transition: opacity 0.2s;
        }
        .speak-btn:hover { opacity: 1; }
        .speak-btn.speaking { color: var(--rose); opacity: 1; }

        .date-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .date-divider::before, .date-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .date-divider span { font-size: 11px; color: var(--text-soft); white-space: nowrap; }

        @media (max-width: 600px) {
          .quick-grid { grid-template-columns: 1fr; }
          .welcome h2 { font-size: 26px; }
          .msg { max-width: 95%; }
          .lang-buttons { flex-direction: column; align-items: center; }
          .lang-btn { width: 200px; }
          .user-type-btns { flex-direction: column; }
          .user-type-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="app">

        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-brand">
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
              <p>Women&apos;s Health Guide</p>
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

        {/* ── CHAT AREA ── */}
        <main className="chat-area">

          {/* Step 1: Language selector */}
          {!language && (
            <div className="welcome">
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
              <p>Apni preferred language chuniye / Please choose your preferred language</p>
              <p className="lang-select-label">🌐 Bhasha chuniye — Choose Language</p>
              <div className="lang-buttons">
                <button className="lang-btn" onClick={() => selectLanguage("hindi")}>
                  <span className="flag">🇮🇳</span> हिंदी
                </button>
                <button className="lang-btn" onClick={() => selectLanguage("english")}>
                  <span className="flag">🇬🇧</span> English
                </button>
              </div>
            </div>
          )}

          {/* Date divider */}
          {messages.length > 0 && (
            <div className="date-divider">
              <span>
                {language === "english" ? "Today's conversation" : "Aaj ki baatcheet"}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="message-group">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <div
                  className={`avatar ${msg.role === "assistant" ? "bot" : "user-av"}`}
                >
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
                <div style={{ maxWidth: "100%" }}>
                  <div
                    className={`bubble ${msg.role === "user" ? "user" : "assistant"}${msg.isEscalation ? " escalation" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: msg.content.replace(
                        /(https?:\/\/[^\s]+)/g,
                        '<a href="$1" target="_blank" style="color:#C2185B; text-decoration:underline;">$1</a>'
                      ),
                    }}
                  />

                  {/* User type quick-reply buttons — only on first bot message */}
                  {msg.role === "assistant" && i === 0 && userType === null && (
                    <div className="user-type-btns">
                      <button
                        className="user-type-btn"
                        onClick={() => handleUserTypeSelect("subscriber")}
                      >
                        🌸 {language === "hindi" ? "Main subscriber hoon" : "I'm a subscriber"}
                      </button>
                      <button
                        className="user-type-btn"
                        onClick={() => handleUserTypeSelect("new_user")}
                      >
                        👋 {language === "hindi" ? "Pehli baar aa rahi hoon" : "First time visitor"}
                      </button>
                    </div>
                  )}

                  {/* Quick chips — index 2 ke baad (welcome back bot message), showWelcome true ho tabhi */}
                  {msg.role === "assistant" && i === 2 && showWelcome && userType !== null && (
                    <div className="quick-chips-inline">
                      <p className="chips-heading">
                        {userType === "subscriber"
                          ? language === "hindi" ? "Aapko kya chahiye aaj? 💖" : "What do you need today? 💖"
                          : language === "hindi" ? "Inme se kuch poochhna chahti hain?" : "Want to ask something?"}
                      </p>
                      <div className="quick-grid">
                        {QUICK_QUESTIONS.map((q) => (
                          <button
                            key={q}
                            className="quick-chip"
                            onClick={() => sendMessage(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div className="msg-time">{formatTime(msg.timestamp)}</div>

                    {/* Speak button */}
                    {msg.role === "assistant" && (
                      <button
                        className={`speak-btn ${isSpeaking ? "speaking" : ""}`}
                        onClick={() =>
                          isSpeaking ? stopSpeaking() : speakText(msg.content)
                        }
                        title={isSpeaking ? "Stop" : "Sunein"}
                      >
                        {isSpeaking ? "🔊 Stop" : "🔈 Sunein"}
                      </button>
                    )}
                  </div>

                  {/* Feedback buttons — only on AI responses with showFeedback=true */}
                  {msg.role === "assistant" && msg.showFeedback && (
                    <div className="feedback-row">
                      {msg.feedbackGiven === null || msg.feedbackGiven === undefined ? (
                        <>
                          <span className="feedback-label">
                            {language === "hindi" ? "Kya madad mili?" : "Was this helpful?"}
                          </span>
                          <button
                            className="feedback-btn yes"
                            onClick={() => handleFeedback(i, "yes")}
                          >
                            ✅ {language === "hindi" ? "Haan" : "Yes"}
                          </button>
                          <button
                            className="feedback-btn no"
                            onClick={() => handleFeedback(i, "no")}
                          >
                            ❌ {language === "hindi" ? "Nahi" : "No"}
                          </button>
                        </>
                      ) : (
                        <span className="feedback-thanks">
                          {msg.feedbackGiven === "yes"
                            ? language === "hindi"
                              ? "💖 Shukriya! Khush raho!"
                              : "💖 Thank you! Stay healthy!"
                            : language === "hindi"
                            ? "🙏 Hum aur behtar karenge!"
                            : "🙏 We'll do better!"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="msg assistant">
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

        {/* ── INPUT AREA ── */}
        {language && (
          <div className="input-area">
            <p className="disclaimer">
              <span>
                ℹ️{" "}
                {language === "hindi"
                  ? "Sirf educational information."
                  : "For educational purposes only."}
              </span>{" "}
              {language === "hindi"
                ? "Medical decision ke liye doctor se zaroor milein."
                : "Please consult a doctor for medical decisions."}
            </p>

            <div className="input-box">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? language === "hindi"
                      ? "🎤 Sun raha hun..."
                      : "🎤 Listening..."
                    : language === "hindi"
                    ? "Sawaal likhein ya mic dabayein…"
                    : "Type or tap mic to speak…"
                }
                rows={1}
              />

              <button
                className={`mic-btn ${isListening ? "listening" : ""}`}
                onClick={isListening ? stopListening : startListening}
                title={
                  isListening
                    ? "Stop"
                    : language === "hindi"
                    ? "Bol ke poochho"
                    : "Speak your question"
                }
              >
                {isListening ? "⏹" : "🎤"}
              </button>

              <button
                className={`send-btn ${isLoading ? "loading" : ""}`}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? "⟳" : "↑"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
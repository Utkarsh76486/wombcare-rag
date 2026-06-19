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
  { icon: "🗓️", text: "Session miss ho gaya" },
  { icon: "🥗", text: "Diet plan access karna hai" },
  { icon: "🌸", text: "Health se related sawaal hai" },
  { icon: "👩‍⚕️", text: "Coach se milna chahti hoon" },
  { icon: "📅", text: "Mera period track karna hai" },
  { icon: "🧘‍♀️", text: "Yoga session kab hai?" },
];

const SUBSCRIBER_QUESTIONS_ENGLISH = [
  { icon: "🗓️", text: "I missed my session" },
  { icon: "🥗", text: "I want to access my diet plan" },
  { icon: "🌸", text: "I have a health question" },
  { icon: "👩‍⚕️", text: "I want to connect with my coach" },
  { icon: "📅", text: "I want to track my period" },
  { icon: "🧘‍♀️", text: "When is my yoga session?" },
];

// ── New user quick questions ───────────────────────────────────────────────
const NEW_USER_QUESTIONS_HINDI = [
  { icon: "🌸", text: "WombCare ke baare mein batao" },
  { icon: "💖", text: "WombCare join kyun karein?" },
  { icon: "🤔", text: "PCOD kya hota hai?" },
  { icon: "✨", text: "Kya PCOD theek ho sakta hai?" },
  { icon: "📋", text: "Mere liye kaunsa plan sahi hai?" },
  { icon: "🩺", text: "Irregular periods normal hai?" },
];

const NEW_USER_QUESTIONS_ENGLISH = [
  { icon: "🌸", text: "Tell me about WombCare" },
  { icon: "💖", text: "Why should I join WombCare?" },
  { icon: "🤔", text: "What is PCOD?" },
  { icon: "✨", text: "Can PCOD be cured?" },
  { icon: "📋", text: "Which plan is right for me?" },
  { icon: "🩺", text: "Are irregular periods normal?" },
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
  const [voicePopupText, setVoicePopupText] = useState("");
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

  // ── Strip emoji & symbols before speaking, so TTS doesn't say "red heart" etc ──
  const stripForSpeech = (text: string) => {
    return text
      // remove emoji & pictographic symbols (covers most ranges incl. skin tones, ZWJ sequences)
      .replace(
        /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu,
        ""
      )
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  // ── Speak assistant response ──────────────────────────────────────────────
  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const cleanText = stripForSpeech(text);
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
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
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setVoicePopupText("");
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setVoicePopupText(final || interim);
      if (final) {
        setInput(final);
        setIsListening(false);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setVoicePopupText("");
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoicePopupText("");
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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          /* ── Premium clinical-rose token system ── */
          --rose-900: #6E1339;
          --rose-700: #971846;
          --rose-600: #B91756;
          --rose-500: #D43E72;
          --rose-200: #F6C9D8;
          --rose-100: #FBE2EA;
          --blush: #FFF9FA;
          --paper: #FFFDFD;
          --gold: #C9A14A;
          --gold-soft: #E9D6A8;
          --ink: #1F1320;
          --ink-soft: #5B4350;
          --ink-faint: #9A8290;
          --line: rgba(110, 19, 57, 0.10);
          --line-strong: rgba(110, 19, 57, 0.18);
          --shadow-sm: 0 2px 10px rgba(110,19,57,0.06);
          --shadow-md: 0 10px 32px rgba(110,19,57,0.12);
          --shadow-lg: 0 24px 64px rgba(110,19,57,0.18);
        }

        html, body {
          height: 100%;
          font-family: 'Inter', sans-serif;
          background: var(--blush);
          color: var(--ink);
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 820px;
          margin: 0 auto;
          position: relative;
          background:
            radial-gradient(ellipse 600px 300px at 50% 0%, var(--rose-100) 0%, transparent 70%),
            var(--blush);
        }

        /* ── Header ── */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 253, 253, 0.85);
          backdrop-filter: blur(24px) saturate(160%);
          border-bottom: 1px solid var(--line);
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 76px;
        }
        .header::after {
          content: '';
          position: absolute;
          left: 28px; right: 28px; bottom: -1px; height: 1px;
          background: linear-gradient(90deg, var(--gold-soft), transparent 60%);
          opacity: 0.6;
        }

        .header-brand { display: flex; align-items: center; gap: 14px; }

        .logo-ring {
          width: 46px; height: 46px;
          border-radius: 14px; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-md), inset 0 0 0 1px rgba(255,255,255,0.4);
          flex-shrink: 0;
          background: white;
        }

        .brand-text h1 {
          font-family: 'Fraunces', serif;
          font-size: 21px; font-weight: 600;
          color: var(--rose-700); letter-spacing: -0.4px; line-height: 1;
        }

        .brand-text .brand-sub {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; text-transform: uppercase;
          letter-spacing: 1.8px; color: var(--ink-faint);
          font-weight: 600; margin-top: 4px;
        }
        .brand-sub .gold-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gold); }

        .status-pill {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: var(--ink-soft); font-weight: 500;
          padding: 6px 12px 6px 10px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 100px;
          box-shadow: var(--shadow-sm);
        }

        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #2E9B5F;
          box-shadow: 0 0 0 3px rgba(46,155,95,0.18);
          animation: breathe 2.4s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }

        .clear-btn {
          padding: 9px 16px; border-radius: 100px;
          border: 1px solid var(--line); background: white;
          color: var(--ink-soft);
          font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .clear-btn:hover { border-color: var(--rose-600); color: var(--rose-700); background: var(--rose-100); }

        /* ── Chat area ── */
        .chat-area {
          flex: 1; overflow-y: auto;
          padding: 28px 22px 150px;
          scroll-behavior: smooth;
        }
        .chat-area::-webkit-scrollbar { width: 5px; }
        .chat-area::-webkit-scrollbar-track { background: transparent; }
        .chat-area::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 4px; }

        /* ── Welcome ── */
        .welcome {
          display: flex; flex-direction: column;
          align-items: center; padding: 56px 20px 36px;
          text-align: center;
          animation: riseIn 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes riseIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .welcome-orb {
          width: 104px; height: 104px; border-radius: 28px; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
          box-shadow: var(--shadow-lg),
                      0 0 0 1px rgba(255,255,255,0.6) inset;
          background: white;
          position: relative;
        }
        .welcome-orb::before {
          content: '';
          position: absolute; inset: -10px;
          border-radius: 36px;
          border: 1px solid var(--gold-soft);
          opacity: 0.5;
        }

        .eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 2.4px;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .eyebrow::before, .eyebrow::after { content: ''; width: 18px; height: 1px; background: var(--gold-soft); }

        .welcome h2 {
          font-family: 'Fraunces', serif;
          font-size: 36px; font-weight: 600;
          color: var(--ink); margin-bottom: 14px; line-height: 1.15;
          letter-spacing: -0.5px;
        }
        .welcome h2 em { font-style: italic; color: var(--rose-600); font-weight: 500; }

        .welcome p { font-size: 15px; color: var(--ink-soft); max-width: 400px; line-height: 1.7; margin-bottom: 8px; }

        .lang-select-label {
          font-size: 12.5px; color: var(--ink-faint);
          margin-top: 32px; margin-bottom: 16px;
          font-weight: 600; letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .lang-buttons { display: flex; gap: 16px; justify-content: center; }

        .lang-btn {
          display: flex; align-items: center; gap: 11px;
          padding: 16px 30px; border-radius: 16px;
          border: 1.5px solid var(--line); background: white;
          color: var(--ink-soft);
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-sm);
          min-width: 150px; justify-content: center;
        }
        .lang-btn:hover {
          border-color: var(--rose-600); color: var(--rose-700);
          transform: translateY(-3px); box-shadow: var(--shadow-md);
        }
        .lang-btn .flag { font-size: 22px; line-height: 1; }

        .quick-section { width: 100%; margin-top: 40px; }
        .quick-section h3 {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 2px; color: var(--ink-faint); font-weight: 700;
          margin-bottom: 16px; text-align: center;
        }

        .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ── Quick chip → premium "service card" treatment ── */
        .quick-chip {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 16px;
          border: 1px solid var(--line); background: white;
          color: var(--ink);
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 500;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left; line-height: 1.4;
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
        }
        .quick-chip::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: linear-gradient(180deg, var(--rose-600), var(--gold));
          opacity: 0; transition: opacity 0.25s;
        }
        .quick-chip .chip-icon {
          font-size: 18px; flex-shrink: 0;
          width: 32px; height: 32px; border-radius: 10px;
          background: var(--rose-100);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s;
        }
        .quick-chip:hover {
          border-color: var(--rose-600); background: var(--blush);
          transform: translateY(-2px); box-shadow: var(--shadow-md);
        }
        .quick-chip:hover::before { opacity: 1; }
        .quick-chip:hover .chip-icon { background: var(--rose-600); transform: scale(1.05); }

        /* ── Inline quick chips (below welcome-back message) ── */
        .quick-chips-inline {
          margin-top: 16px;
          width: 100%;
          animation: riseIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chips-heading {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 1.6px; color: var(--ink-faint);
          margin-bottom: 12px; font-weight: 700;
        }

        /* ── User type buttons ── */
        .user-type-btns {
          display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap;
        }

        .user-type-btn {
          display: flex; align-items: center; gap: 9px;
          padding: 12px 22px; border-radius: 14px;
          border: 1.5px solid var(--line); background: white;
          color: var(--ink-soft);
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-sm);
        }
        .user-type-btn:hover {
          border-color: var(--rose-600); background: var(--blush); color: var(--rose-700);
          transform: translateY(-2px); box-shadow: var(--shadow-md);
        }

        /* ── Messages ── */
        .message-group { display: flex; flex-direction: column; gap: 18px; }

        .msg { display: flex; gap: 12px; max-width: 88%; animation: msgIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .msg.user      { align-self: flex-end; flex-direction: row-reverse; }
        .msg.assistant { align-self: flex-start; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .avatar {
          width: 36px; height: 36px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; align-self: flex-end; overflow: hidden;
        }
        .avatar.bot      { background: white; box-shadow: var(--shadow-sm); border: 1px solid var(--line); }
        .avatar.user-av  { background: linear-gradient(160deg, var(--rose-900), var(--rose-600)); font-size: 14px; color: white; font-weight: 600; }

        /* ── Bubble: clinical-note styling, not generic gradient pill ── */
        .bubble {
          padding: 16px 19px; border-radius: 4px 18px 18px 18px;
          font-size: 14.5px; line-height: 1.7; position: relative;
          white-space: pre-line;
        }

        .bubble.user {
          background: linear-gradient(155deg, var(--rose-700), var(--rose-600));
          color: white; border-radius: 18px 4px 18px 18px;
          box-shadow: var(--shadow-md);
        }
        .bubble.assistant {
          background: white; color: var(--ink);
          border: 1px solid var(--line);
          box-shadow: var(--shadow-sm);
          border-left: 3px solid var(--rose-200);
        }
        .bubble.escalation {
          background: #FFF6EC;
          border-color: #E8A33D;
          border-left: 3px solid #E8A33D;
        }
        .bubble a { color: var(--rose-700); text-decoration: underline; }

        .msg-time { font-size: 10px; color: var(--ink-faint); margin-top: 5px; opacity: 0.8; text-align: right; letter-spacing: 0.2px; }
        .msg.assistant .msg-time { text-align: left; }

        /* ── Feedback row ── */
        .feedback-row {
          display: flex; align-items: center; gap: 8px;
          margin-top: 8px; animation: riseIn 0.3s ease;
        }
        .feedback-label {
          font-size: 11px; color: var(--ink-faint); font-weight: 500;
        }
        .feedback-btn {
          padding: 5px 13px; border-radius: 100px; border: 1px solid var(--line);
          background: white; font-size: 12px; color: var(--ink-soft); font-weight: 500;
          font-family: 'Inter', sans-serif; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; gap: 4px;
        }
        .feedback-btn.yes:hover { border-color: #2E9B5F; background: #EFF9F2; color: #1F7A45; }
        .feedback-btn.no:hover  { border-color: var(--rose-600); background: var(--rose-100); color: var(--rose-700); }
        .feedback-thanks { font-size: 11px; color: var(--ink-faint); font-style: italic; }

        /* ── Typing ── */
        .typing-bubble {
          background: white; border: 1px solid var(--line);
          border-radius: 4px 18px 18px 18px;
          border-left: 3px solid var(--rose-200);
          padding: 17px 20px;
          display: flex; align-items: center; gap: 5px;
          box-shadow: var(--shadow-sm);
        }
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--rose-600); opacity: 0.4;
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
          width: 100%; max-width: 820px;
          padding: 14px 22px 22px;
          background: linear-gradient(to top, var(--blush) 80%, transparent);
        }

        .disclaimer {
          text-align: center; font-size: 10.5px;
          color: var(--ink-faint); margin-bottom: 11px; opacity: 0.85;
          font-weight: 500;
        }
        .disclaimer .info-badge { color: var(--rose-600); font-weight: 700; }

        .input-box {
          display: flex; align-items: flex-end; gap: 10px;
          background: white;
          border: 1.5px solid var(--line); border-radius: 20px;
          padding: 11px 11px 11px 20px;
          box-shadow: var(--shadow-lg);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-box:focus-within {
          border-color: var(--rose-600);
          box-shadow: var(--shadow-lg), 0 0 0 4px rgba(185,23,86,0.07);
        }

        .input-box textarea {
          flex: 1; border: none; outline: none; resize: none;
          font-family: 'Inter', sans-serif; font-size: 14.5px;
          color: var(--ink); background: transparent;
          line-height: 1.5; max-height: 120px; min-height: 24px; padding: 3px 0;
        }
        .input-box textarea::placeholder { color: var(--ink-faint); opacity: 0.8; }

        .mic-btn {
          width: 44px; height: 44px; border-radius: 14px; border: none;
          background: var(--rose-100); color: var(--rose-700);
          font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s; flex-shrink: 0;
        }
        .mic-btn:hover { background: var(--rose-200); transform: scale(1.06); }
        .mic-btn.listening {
          background: var(--rose-600); color: white;
          animation: mic-pulse 1s ease-in-out infinite;
        }

        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185,23,86,0.4); }
          50%       { box-shadow: 0 0 0 9px rgba(185,23,86,0); }
        }

        .send-btn {
          width: 44px; height: 44px; border-radius: 14px; border: none;
          background: linear-gradient(155deg, var(--rose-700), var(--rose-600));
          color: white; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s; flex-shrink: 0;
          box-shadow: 0 6px 18px rgba(185,23,86,0.4);
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 8px 22px rgba(185,23,86,0.5); }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

        .speak-btn {
          background: none; border: none; cursor: pointer;
          font-size: 12.5px; color: var(--ink-faint); font-weight: 500;
          padding: 4px 0 0 0;
          display: inline-flex; align-items: center; gap: 4px;
          opacity: 0.7; transition: opacity 0.2s;
        }
        .speak-btn:hover { opacity: 1; }
        .speak-btn.speaking { color: var(--rose-600); opacity: 1; }

        .date-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0; }
        .date-divider::before, .date-divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }
        .date-divider span { font-size: 10.5px; color: var(--ink-faint); white-space: nowrap; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

        /* ── Voice popup overlay (Google-Assistant style) ── */
        .voice-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(31, 19, 32, 0.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: overlayFadeIn 0.25s ease;
        }
        @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .voice-sheet {
          width: 100%; max-width: 480px;
          background: var(--paper);
          border-radius: 28px 28px 0 0;
          padding: 32px 28px 40px;
          text-align: center;
          box-shadow: 0 -20px 60px rgba(110,19,57,0.25);
          animation: sheetRise 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes sheetRise {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        .voice-sheet-brand {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 1.6px;
          text-transform: uppercase; color: var(--rose-600);
          margin-bottom: 22px;
        }
        .voice-sheet-brand .gold-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gold); }

        .voice-orb-wrap {
          width: 88px; height: 88px; margin: 0 auto 22px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          position: relative;
          background: linear-gradient(155deg, var(--rose-700), var(--rose-600));
          box-shadow: 0 12px 32px rgba(185,23,86,0.35);
        }
        .voice-orb-wrap::before, .voice-orb-wrap::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1.5px solid var(--rose-500);
          opacity: 0;
          animation: ripple 1.8s ease-out infinite;
        }
        .voice-orb-wrap::after { animation-delay: 0.6s; }
        @keyframes ripple {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .voice-orb-icon { font-size: 30px; position: relative; z-index: 1; }

        .voice-sheet-status {
          font-family: 'Fraunces', serif;
          font-size: 18px; font-weight: 600;
          color: var(--ink); margin-bottom: 10px;
        }

        .voice-sheet-transcript {
          min-height: 46px;
          font-size: 14.5px; color: var(--ink-soft);
          line-height: 1.6; max-width: 380px; margin: 0 auto 26px;
        }
        .voice-sheet-transcript.placeholder { color: var(--ink-faint); font-style: italic; }

        .voice-sheet-stop {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 26px; border-radius: 100px; border: none;
          background: var(--rose-100); color: var(--rose-700);
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .voice-sheet-stop:hover { background: var(--rose-200); }

        @media (max-width: 600px) {
          .quick-grid { grid-template-columns: 1fr; }
          .welcome h2 { font-size: 28px; }
          .msg { max-width: 95%; }
          .lang-buttons { flex-direction: column; align-items: center; }
          .lang-btn { width: 220px; }
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
                width={46}
                height={46}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
            <div className="brand-text">
              <h1>WombCare</h1>
              <div className="brand-sub">
                <span className="gold-dot" />
                Doctor-Led Care
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="status-pill">
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
                  width={104}
                  height={104}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className="eyebrow">Women&apos;s Health Guide</div>
              <h2>
                Namaste, main hoon
                <br />
                <em>WombCare</em>
              </h2>
              <p>Apni preferred language chuniye / Please choose your preferred language</p>
              <p className="lang-select-label">Bhasha chuniye — Choose Language</p>
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
                      width={36}
                      height={36}
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
                        '<a href="$1" target="_blank">$1</a>'
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
                          ? language === "hindi" ? "Aapko kya chahiye aaj?" : "What do you need today?"
                          : language === "hindi" ? "Inme se kuch poochhna chahti hain?" : "Want to ask something?"}
                      </p>
                      <div className="quick-grid">
                        {QUICK_QUESTIONS.map((q) => (
                          <button
                            key={q.text}
                            className="quick-chip"
                            onClick={() => sendMessage(q.text)}
                          >
                            <span className="chip-icon">{q.icon}</span>
                            <span>{q.text}</span>
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
                    width={36}
                    height={36}
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
              <span className="info-badge">ℹ️ </span>
              {language === "hindi"
                ? "Sirf educational information. Medical decision ke liye doctor se zaroor milein."
                : "For educational purposes only. Please consult a doctor for medical decisions."}
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

      {/* ── VOICE ASSISTANT POPUP (Google-Assistant style) — mic input only ── */}
      {isListening && (
        <div className="voice-overlay" onClick={() => stopListening()}>
          <div className="voice-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="voice-sheet-brand">
              <span className="gold-dot" />
              WombCare Assistant
            </div>

            <div className="voice-orb-wrap">
              <span className="voice-orb-icon">🎤</span>
            </div>

            <div className="voice-sheet-status">
              {language === "hindi" ? "Sun rahi hoon…" : "Listening…"}
            </div>

            <div className={`voice-sheet-transcript ${!voicePopupText ? "placeholder" : ""}`}>
              {voicePopupText ||
                (language === "hindi" ? "Bolna shuru karein…" : "Start speaking…")}
            </div>

            <button className="voice-sheet-stop" onClick={() => stopListening()}>
              ⏹ {language === "hindi" ? "Band karein" : "Stop"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
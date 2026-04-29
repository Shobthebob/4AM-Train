import { useState, useEffect, useRef, useCallback } from "react";

// --- DIALOGUE TREE ---
const NODES = {
  open1: {
    act: 1,
    mira: "I wasn't supposed to come here… I just didn't know where else to go.",
    responses: {
      lavender: { text: "You're here now. That's all that has to matter for a minute.", next: "open2a" },
      honey: { text: "You don't have to explain anything yet.", next: "open2a" },
      ginger: { text: "What happened, Mira?", next: "open2b" },
      blend: { text: "You don't need a reason to be here. But when you can, I want to know.", next: "open2a" },
    },
  },
  open2a: {
    act: 1,
    mira: "Thanks. I — I left the tour. Just packed my bag during soundcheck and walked out the side door.",
    responses: {
      lavender: { text: "That must have taken a lot.", next: "mid1" },
      honey: { text: "How long have you been wanting to do that?", next: "mid1" },
      ginger: { text: "Does anyone know where you are?", next: "mid2" },
      blend: { text: "Walking off-stage takes more than people think. What finally made you do it?", next: "mid1" },
    },
  },
  open2b: {
    act: 1,
    mira: "I left the tour. Soundcheck was starting and I just… couldn't do it. Couldn't stand on that stage one more time pretending everything was fine.",
    responses: {
      lavender: { text: "You don't have to pretend here.", next: "mid1" },
      honey: { text: "When did it stop being something you wanted?", next: "mid1" },
      ginger: { text: "So you ran.", next: "mid2" },
      blend: { text: "You don't have to perform anything in this kitchen. But I'd rather know the real version when you're ready.", next: "mid1" },
    },
  },
  mid1: {
    act: 2,
    mira: "I used to love playing. The music, the crowds — it felt like breathing. But somewhere along the way it became… suffocating. Like the music wasn't mine anymore.",
    responses: {
      lavender: { text: "Maybe you just need space to remember why you started.", next: "mid3" },
      honey: { text: "It's okay to outgrow something, even something you loved.", next: "mid3" },
      ginger: { text: "But disappearing doesn't bring that feeling back.", next: "mid4" },
      blend: { text: "It's hard when something you loved starts to feel like a cage. Do you want it back, or do you want out?", next: "mid3" },
    },
  },
  mid2: {
    act: 2,
    mira: "Don't look at me like that. I know what it looks like. I know I'm being — I just couldn't breathe in that van anymore. …What time is it?",
    responses: {
      lavender: { text: "I'm not judging you. I promise.", next: "mid3" },
      honey: { text: "You needed air. That's human.", next: "mid3" },
      ginger: { text: "What are you actually running from, Mira?", next: "mid4" },
      blend: { text: "I'm not judging. I'm asking — what changed in there?", next: "mid3" },
    },
  },
  mid3: {
    act: 2,
    mira: "There's a train at 5:15. Goes south. I could just… disappear for a while. New city. No one knows me. Start over.",
    responses: {
      lavender: { text: "Is that what you really want, or just what feels safest right now?", next: "late1" },
      honey: { text: "You can take time without vanishing completely.", next: "late1" },
      ginger: { text: "A new city won't fix what's broken inside you.", next: "late2" },
      blend: { text: "Disappearing might feel like the answer. Just — is it the running you want, or the rest?", next: "late1" },
    },
  },
  mid4: {
    act: 2,
    mira: "I bought the ticket already. 5:15 AM, southbound. I wasn't going to tell anyone. I was just going to go.",
    responses: {
      lavender: { text: "But you came here instead.", next: "late1" },
      honey: { text: "Part of you doesn't want to go. That's why you're sitting here.", next: "late1" },
      ginger: { text: "Running without telling anyone — that's not starting over. That's giving up.", next: "late2" },
      blend: { text: "You bought the ticket. But you're at my table, not the platform. That means something.", next: "late1" },
    },
  },
  late1: {
    act: 3,
    mira: "You know what I keep thinking about? My mom said something once. She said, 'You can leave a place without abandoning it.' I didn't understand what she meant then.",
    responses: {
      lavender: { text: "Maybe you're starting to understand now.", next: "FINAL" },
      honey: { text: "She sounds like she knew you pretty well.", next: "FINAL" },
      ginger: { text: "Do you think getting on that train would be leaving — or abandoning?", next: "FINAL" },
      blend: { text: "Leaving and abandoning aren't the same thing. You're allowed to do one without the other.", next: "FINAL" },
    },
  },
  late2: {
    act: 3,
    mira: "You think I don't know that? You think I haven't told myself the same thing for weeks? I'm tired of being the person everyone needs me to be.",
    responses: {
      lavender: { text: "Then be whoever you need. But do it somewhere you're not alone.", next: "FINAL" },
      honey: { text: "You don't owe anyone a performance. Not even yourself.", next: "FINAL" },
      ginger: { text: "Being tired isn't the same as being done. You know the difference.", next: "FINAL" },
      blend: { text: "Stop performing for them. But don't disappear from yourself — that's what the train will do.", next: "FINAL" },
    },
  },
};

const ING_EFFECTS = {
  lavender: { comfort: 2, pressure: 0, clarity: 0 },
  honey: { comfort: 1, pressure: 0, clarity: 1 },
  ginger: { comfort: -1, pressure: 2, clarity: 2 },
};

// Three stages mirroring the process of making tea
const ING_STAGES = [
  {
    lavender: { emoji: "💧", label: "Water",       desc: "Gentle · Clear" },
    honey:    { emoji: "🥛", label: "Milk",        desc: "Soft · Warm" },
    ginger:   { emoji: "🍃", label: "Tea Leaves",  desc: "Strong · Grounding" },
  },
  {
    lavender: { emoji: "🟫", label: "Brown Sugar", desc: "Mellow · Round" },
    honey:    { emoji: "🍬", label: "Sugar",       desc: "Light · Simple" },
    ginger:   { emoji: "🧂", label: "Salt",        desc: "Sharp · Honest" },
  },
  {
    lavender: { emoji: "💜", label: "Lavender",    desc: "Calm · Gentle" },
    honey:    { emoji: "🍯", label: "Honey",       desc: "Comfort · Warmth" },
    ginger:   { emoji: "🫚", label: "Ginger",      desc: "Honesty · Truth" },
  },
];

const ING_STAGE_LABELS = [
  "Start with the base…",
  "A touch of sweetness…",
  "The finishing note…",
];

const NARRATION = "The rain hasn't stopped since midnight. You hear a knock — quiet, uncertain. When you open the door, Mira is standing there, soaked, a backpack over one shoulder. You haven't seen her in months. Without a word, you step aside. She walks to the kitchen table and sits down. You put the kettle on.";

const TOTAL_EXCHANGES = 6;

// --- MUSIC CONFIG ---
const MUSIC = {
  title: "/music/Title/The_Midnight_Pane.mp3",
  main: [
    "/music/main/Before_The_Kettle.mp3",
    "/music/main/Kitchen_at_Four.mp3",
    "/music/main/Teacup_Still_Warm.mp3",
  ],
  credits: "/music/end/Porcelain_and_Grey_Light.mp3",
};

// --- RAIN ---
function RainDrop({ delay, left, duration, opacity }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${left}%`,
        top: "-10px",
        width: "1px",
        height: `${10 + Math.random() * 20}px`,
        background: "linear-gradient(to bottom, transparent, rgba(160,185,220,0.45))",
        animation: `rainFall ${duration}s linear ${delay}s infinite`,
        opacity,
      }}
    />
  );
}

// --- STEAM PARTICLE ---
function SteamParticle({ delay, left }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        left: `${left}%`,
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(230,220,200,0.4) 0%, transparent 70%)",
        animation: `steamRise 2.5s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

// --- SVG ILLUSTRATIONS ---

function TitleIllustration() {
  return (
    <svg
      viewBox="0 0 180 140"
      width="180"
      height="140"
      style={{ display: "block", margin: "0 auto", opacity: 0.88 }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="titleTeaGlow" cx="50%" cy="88%" r="42%">
          <stop offset="0%" stopColor="rgba(200,150,50,0.25)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="24" y="8" width="132" height="120" rx="1" fill="none"
        stroke="rgba(180,150,80,0.22)" strokeWidth="1.8" />
      <line x1="24" y1="68" x2="156" y2="68" stroke="rgba(180,150,80,0.18)" strokeWidth="1.2" />
      <line x1="90" y1="8" x2="90" y2="128" stroke="rgba(180,150,80,0.18)" strokeWidth="1.2" />
      <rect x="26" y="10" width="62" height="56" fill="rgba(8,12,22,0.75)" />
      <rect x="92" y="10" width="62" height="56" fill="rgba(8,12,22,0.75)" />
      {[32,42,50,60,72,80,98,110,120,132,144,152].map((x, i) => (
        <line key={i} x1={x} y1={12 + (i % 5) * 7} x2={x - 2} y2={25 + (i % 5) * 7}
          stroke="rgba(100,150,200,0.28)" strokeWidth="0.7" />
      ))}
      <rect x="26" y="70" width="128" height="56" fill="rgba(14,10,6,0.8)" />
      <rect x="26" y="70" width="128" height="56" fill="url(#titleTeaGlow)" />
      <rect x="72" y="88" width="36" height="26" rx="2.5"
        fill="rgba(18,13,7,0.95)" stroke="rgba(200,160,70,0.45)" strokeWidth="1.1" />
      <path d="M108 96 Q122 101 108 110"
        fill="none" stroke="rgba(200,160,70,0.35)" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="90" cy="90" rx="14" ry="2.5" fill="rgba(160,110,40,0.4)" />
      <ellipse cx="90" cy="115" rx="22" ry="3.5"
        fill="none" stroke="rgba(200,160,70,0.22)" strokeWidth="1" />
      <path d="M84 87 Q82 80 85 74 Q88 68 86 62"
        fill="none" stroke="rgba(215,200,175,0.2)" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M90 86 Q88 78 91 72 Q94 66 92 59"
        fill="none" stroke="rgba(215,200,175,0.22)" strokeWidth="1" strokeLinecap="round" />
      <path d="M96 87 Q98 80 95 74 Q92 68 94 62"
        fill="none" stroke="rgba(215,200,175,0.2)" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="18" y="126" width="144" height="7" rx="1"
        fill="rgba(28,20,10,0.9)" stroke="rgba(180,140,60,0.12)" strokeWidth="1" />
    </svg>
  );
}

function DoorScene() {
  return (
    <svg
      viewBox="0 0 140 180"
      width="128"
      height="164"
      style={{ display: "block", margin: "0 auto 28px", opacity: 0.9 }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="doorwayWarmth" cx="0%" cy="60%" r="60%">
          <stop offset="0%" stopColor="rgba(200,155,55,0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="140" height="180" fill="#080c14" />
      <rect x="18" y="8" width="16" height="168" rx="1"
        fill="#0e0b06" stroke="rgba(160,130,60,0.2)" strokeWidth="1" />
      <rect x="106" y="8" width="16" height="168" rx="1"
        fill="#0e0b06" stroke="rgba(160,130,60,0.2)" strokeWidth="1" />
      <rect x="18" y="8" width="104" height="14" rx="1"
        fill="#0e0b06" stroke="rgba(160,130,60,0.2)" strokeWidth="1" />
      <rect x="34" y="22" width="72" height="154" fill="#050709" />
      {[38,50,60,72,84,96,102].map((x, i) => (
        <line key={i} x1={x} y1={26 + (i % 5) * 12} x2={x - 2} y2={44 + (i % 5) * 12}
          stroke="rgba(80,120,175,0.3)" strokeWidth="0.75" />
      ))}
      <path d="M58 68 Q59 54 70 52 Q81 52 82 65" fill="#040608" />
      <ellipse cx="70" cy="72" rx="12" ry="13" fill="#040608" />
      <rect x="65" y="83" width="10" height="7" fill="#040608" />
      <path d="M53 90 Q58 88 70 89 Q82 88 87 90 L91 152 L49 152 Z" fill="#050709" />
      <path d="M83 94 Q97 98 96 122 Q95 134 84 136 L82 94 Z"
        fill="#080b12" stroke="rgba(80,100,140,0.15)" strokeWidth="0.8" />
      <rect x="0" y="0" width="140" height="180" fill="url(#doorwayWarmth)" />
    </svg>
  );
}

function MiraAvatar() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="18"
      height="18"
      style={{
        display: "inline-block",
        marginRight: "7px",
        verticalAlign: "middle",
        borderRadius: "50%",
        border: "1px solid rgba(150,170,210,0.22)",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="9" fill="#0c1018" />
      <path d="M1 18 Q3 12 9 11 Q15 12 17 18" fill="#050810" />
      <ellipse cx="9" cy="8" rx="5" ry="5.5" fill="#050810" />
    </svg>
  );
}

function EndingIllustration({ type }) {
  if (!type) return null;

  if (type === "stays") {
    return (
      <svg viewBox="0 0 200 90" width="200" height="90"
        style={{ display: "block", margin: "0 auto 36px", opacity: 0.85 }} aria-hidden="true">
        <defs>
          <radialGradient id="staysGlow" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="rgba(200,150,50,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect x="0" y="48" width="200" height="42" fill="rgba(16,12,7,0.9)" />
        <line x1="0" y1="48" x2="200" y2="48" stroke="rgba(180,145,65,0.18)" strokeWidth="1" />
        <rect x="0" y="0" width="200" height="90" fill="url(#staysGlow)" />
        <rect x="45" y="22" width="30" height="28" rx="2.5"
          fill="rgba(14,10,5,0.95)" stroke="rgba(195,155,65,0.45)" strokeWidth="1.1" />
        <path d="M75 30 Q86 34 75 40" fill="none" stroke="rgba(195,155,65,0.32)" strokeWidth="1.3" strokeLinecap="round" />
        <ellipse cx="60" cy="23" rx="12" ry="2.5" fill="rgba(155,105,38,0.35)" />
        <rect x="125" y="22" width="30" height="28" rx="2.5"
          fill="rgba(14,10,5,0.95)" stroke="rgba(195,155,65,0.45)" strokeWidth="1.1" />
        <path d="M155 30 Q166 34 155 40" fill="none" stroke="rgba(195,155,65,0.32)" strokeWidth="1.3" strokeLinecap="round" />
        <ellipse cx="140" cy="23" rx="12" ry="2.5" fill="rgba(155,105,38,0.35)" />
        <rect x="87" y="52" width="26" height="34" rx="3"
          fill="rgba(12,15,22,0.85)" stroke="rgba(110,140,190,0.28)" strokeWidth="0.9" />
        <rect x="90" y="55" width="20" height="27" rx="1.5" fill="rgba(18,28,45,0.8)" />
        <path d="M56 21 Q54 14 57 8" fill="none" stroke="rgba(210,195,170,0.2)" strokeWidth="1" strokeLinecap="round" />
        <path d="M63 20 Q61 12 64 6" fill="none" stroke="rgba(210,195,170,0.22)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "leaves") {
    return (
      <svg viewBox="0 0 200 90" width="200" height="90"
        style={{ display: "block", margin: "0 auto 36px", opacity: 0.82 }} aria-hidden="true">
        <rect x="0" y="48" width="200" height="42" fill="rgba(10,12,18,0.9)" />
        <line x1="0" y1="48" x2="200" y2="48" stroke="rgba(110,130,170,0.15)" strokeWidth="1" />
        <rect x="46" y="22" width="30" height="28" rx="2.5"
          fill="rgba(12,10,8,0.95)" stroke="rgba(140,160,195,0.35)" strokeWidth="1.1" />
        <path d="M76 30 Q87 34 76 40" fill="none" stroke="rgba(140,160,195,0.25)" strokeWidth="1.3" strokeLinecap="round" />
        <ellipse cx="61" cy="23" rx="12" ry="2.5" fill="rgba(80,110,60,0.25)" />
        <line x1="152" y1="4" x2="152" y2="86" stroke="rgba(90,110,150,0.22)" strokeWidth="1.5" />
        <line x1="136" y1="7" x2="151" y2="4" stroke="rgba(90,110,150,0.18)" strokeWidth="1.1" />
        <line x1="136" y1="83" x2="151" y2="86" stroke="rgba(90,110,150,0.18)" strokeWidth="1.1" />
        {[157,163,169,175,181].map((x, i) => (
          <line key={i} x1={x} y1={8 + i * 14} x2={x - 2} y2={22 + i * 14}
            stroke="rgba(75,115,170,0.22)" strokeWidth="0.75" />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 90" width="200" height="90"
      style={{ display: "block", margin: "0 auto 36px", opacity: 0.82 }} aria-hidden="true">
      <rect x="58" y="4" width="84" height="58" fill="rgba(6,9,15,0.85)"
        stroke="rgba(110,130,165,0.18)" strokeWidth="1.2" />
      <line x1="58" y1="33" x2="142" y2="33" stroke="rgba(110,130,165,0.12)" strokeWidth="1" />
      <line x1="100" y1="4" x2="100" y2="62" stroke="rgba(110,130,165,0.12)" strokeWidth="1" />
      {[63,72,82,108,120,132].map((x, i) => (
        <line key={i} x1={x} y1={7 + (i % 3) * 9} x2={x - 2} y2={20 + (i % 3) * 9}
          stroke="rgba(75,115,170,0.22)" strokeWidth="0.7" />
      ))}
      <line x1="78" y1="62" x2="95" y2="36" stroke="rgba(70,90,120,0.22)" strokeWidth="0.9" />
      <line x1="122" y1="62" x2="105" y2="36" stroke="rgba(70,90,120,0.22)" strokeWidth="0.9" />
      <rect x="97" y="33" width="6" height="4" rx="1" fill="rgba(70,90,120,0.3)" />
      <rect x="0" y="68" width="200" height="22" fill="rgba(14,10,7,0.9)" />
      <line x1="0" y1="68" x2="200" y2="68" stroke="rgba(170,140,60,0.12)" strokeWidth="1" />
      <rect x="68" y="50" width="24" height="20" rx="2"
        fill="rgba(14,10,5,0.95)" stroke="rgba(185,150,65,0.32)" strokeWidth="1" />
      <rect x="108" y="50" width="24" height="20" rx="2"
        fill="rgba(14,10,5,0.95)" stroke="rgba(120,145,180,0.25)" strokeWidth="1" />
      <path d="M92 56 Q99 59 92 63" fill="none" stroke="rgba(185,150,65,0.22)" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M132 56 Q139 59 132 63" fill="none" stroke="rgba(120,145,180,0.2)" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// --- SETTINGS PANEL ---
function SettingsPanel({ volumes, onChange, onClose, onQuit }) {
  const sliders = [
    { key: "master", label: "Master Volume" },
    { key: "sfx",    label: "SFX Volume" },
    { key: "music",  label: "Music Volume" },
  ];
  return (
    <div style={{
      position: "fixed",
      top: "50px",
      right: "12px",
      zIndex: 300,
      background: "rgba(8,11,18,0.97)",
      border: "1px solid rgba(220,170,80,0.18)",
      borderRadius: "10px",
      padding: "16px 18px 14px",
      width: "220px",
      backdropFilter: "blur(10px)",
      animation: "fadeInLine 0.25s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: "rgba(220,170,80,0.55)" }}>
          Settings
        </span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "rgba(220,170,80,0.4)",
          cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "0 2px",
        }}>×</button>
      </div>
      {sliders.map(({ key, label }) => (
        <div key={key} style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", color: "rgba(190,180,160,0.5)", letterSpacing: "1px" }}>{label}</span>
            <span style={{ fontSize: "10px", color: "rgba(220,170,80,0.45)", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(volumes[key] * 100)}
            </span>
          </div>
          <input
            type="range" min="0" max="1" step="0.01"
            value={volumes[key]}
            onChange={e => onChange(key, parseFloat(e.target.value))}
            className="tea-slider"
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(220,170,80,0.08)", marginTop: "6px", paddingTop: "12px" }}>
        <button onClick={onQuit} style={{
          width: "100%", background: "transparent",
          border: "1px solid rgba(200,100,80,0.2)",
          borderRadius: "5px", padding: "7px 0",
          fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
          color: "rgba(200,120,100,0.45)", cursor: "pointer", fontFamily: "inherit",
          fontStyle: "italic", transition: "all 0.25s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(200,100,80,0.5)"; e.currentTarget.style.color = "rgba(200,120,100,0.85)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(200,100,80,0.2)"; e.currentTarget.style.color = "rgba(200,120,100,0.45)"; }}
        >
          Return to title
        </button>
      </div>
    </div>
  );
}

// --- MAIN ---
export default function FourAMTea() {
  const [screen, setScreen]               = useState("title");
  const [nodeId, setNodeId]               = useState("open1");
  const [stats, setStats]                 = useState({ comfort: 4, pressure: 0, clarity: 0 });
  const [history, setHistory]             = useState([]);
  const [selected, setSelected]           = useState([]);
  const [showTeaPanel, setShowTeaPanel]   = useState(false);
  const [typedText, setTypedText]         = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [ending, setEnding]               = useState(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showThunder, setShowThunder]     = useState(false);
  const [showSteam, setShowSteam]         = useState(false);
  const [fadeIn, setFadeIn]               = useState(false);
  const [narrationDone, setNarrationDone] = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [volumes, setVolumes]               = useState({ master: 0.8, sfx: 0.7, music: 0.7 });

  const scrollRef          = useRef(null);
  const audioRef           = useRef(null);
  const mainTrackIdxRef    = useRef(0);
  const audioCtxRef        = useRef(null);
  const volumesRef         = useRef({ master: 0.8, sfx: 0.7, music: 0.7 });
  const typingIntervalRef  = useRef(null);
  const typingCallbackRef  = useRef(null);
  const typingFullTextRef  = useRef("");

  const rainDrops = useRef(
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3,
      left: Math.random() * 100,
      duration: 0.6 + Math.random() * 0.9,
      opacity: 0.25 + Math.random() * 0.45,
    }))
  ).current;

  const steamParticles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.8,
      left: 40 + Math.random() * 20,
    }))
  ).current;

  // Keep volumes ref in sync and update live audio volume
  useEffect(() => {
    volumesRef.current = volumes;
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, volumes.master * volumes.music);
    }
  }, [volumes]);

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        setShowThunder(true);
        setTimeout(() => setShowThunder(false), 220);
      }
    }, 14000 + Math.random() * 18000);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, typedText, showTeaPanel]);

  // --- AUDIO ---
  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
  }, []);

  const playTrack = useCallback((src, loop = true) => {
    stopMusic();
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = Math.min(1, volumesRef.current.master * volumesRef.current.music);
    audio.play().catch(() => {});
    audioRef.current = audio;
  }, [stopMusic]);

  const playMainSequence = useCallback(() => {
    stopMusic();
    mainTrackIdxRef.current = 0;
    const playNext = () => {
      const src = MUSIC.main[mainTrackIdxRef.current];
      const audio = new Audio(src);
      audio.volume = Math.min(1, volumesRef.current.master * volumesRef.current.music);
      audio.onended = () => {
        if (audioRef.current === audio) {
          mainTrackIdxRef.current = (mainTrackIdxRef.current + 1) % MUSIC.main.length;
          playNext();
        }
      };
      audio.play().catch(() => {});
      audioRef.current = audio;
    };
    playNext();
  }, [stopMusic]);

  // Start title music on mount; retry on first click if autoplay was blocked by browser
  useEffect(() => {
    playTrack(MUSIC.title, true);
    const unlock = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      stopMusic();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before page unload (refresh/close) when mid-game
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (screen === "playing" || screen === "narration" || screen === "ending") {
        e.preventDefault();
        e.returnValue = "Your progress will be lost if you leave.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [screen]);

  // SFX via Web Audio API (no files needed)
  const playSFX = useCallback((type) => {
    const { master, sfx } = volumesRef.current;
    const vol = master * sfx;
    if (vol <= 0) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.1);
        gain.gain.setValueAtTime(vol * 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
        osc.start(now); osc.stop(now + 0.13);
      } else if (type === "type") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(900 + Math.random() * 500, now);
        gain.gain.setValueAtTime(vol * 0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        osc.start(now); osc.stop(now + 0.03);
      }
    } catch (_) {}
  }, []);

  // typeText with skip support and SFX ticks
  const typeText = useCallback((text, cb) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    typingFullTextRef.current = text;
    typingCallbackRef.current = cb || null;
    setIsTyping(true);
    setTypedText("");
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      i++;
      setTypedText(text.slice(0, i));
      if (i % 3 === 0) playSFX("type");
      if (i >= text.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
        if (cb) cb();
      }
    }, 32);
  }, [playSFX]);

  const skipTyping = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setTypedText(typingFullTextRef.current);
    setIsTyping(false);
    const cb = typingCallbackRef.current;
    typingCallbackRef.current = null;
    if (cb) cb();
  }, []);

  // --- GAME LOGIC ---
  const currentStage   = Math.min(Math.floor(exchangeCount / 2), 2);
  const currentIngInfo = ING_STAGES[currentStage];

  const progress = Math.min(exchangeCount / TOTAL_EXCHANGES, 1);
  const minutes  = Math.floor(progress * 75);
  const timeStr  = `${4 + Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, "0")} AM`;
  const kettleLabel =
    progress < 0.25 ? "kettle warming…"
    : progress < 0.55 ? "kettle simmering…"
    : progress < 0.85 ? "kettle restless…"
    : "kettle almost ready";

  const startGame = () => {
    stopMusic(); // silence during narration screen
    setScreen("narration");
    setNodeId("open1");
    setStats({ comfort: 4, pressure: 0, clarity: 0 });
    setHistory([]);
    setExchangeCount(0);
    setEnding(null);
    setSelected([]);
    setShowTeaPanel(false);
    setNarrationDone(false);
    setTypedText("");
    setTimeout(() => {
      typeText(NARRATION, () => setNarrationDone(true));
    }, 600);
  };

  const enterKitchen = () => {
    playMainSequence(); // start main game music
    setScreen("playing");
    setHistory([{ type: "narration", text: NARRATION }]);
    setTypedText("");
    const node = NODES.open1;
    setTimeout(() => {
      typeText(node.mira, () => {
        setHistory(prev => [...prev, { type: "mira", text: node.mira }]);
        setTypedText("");
        setShowTeaPanel(true);
      });
    }, 800);
  };

  const toggleIng = (ing) => {
    setSelected(prev => prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]);
  };

  const getResponse = () => {
    const node = NODES[nodeId];
    if (!node || selected.length === 0) return null;
    if (selected.length === 1) return node.responses[selected[0]];
    return node.responses.blend;
  };

  const offerTea = () => {
    if (selected.length === 0) return;
    const node = NODES[nodeId];
    if (!node) return;
    const response = getResponse();
    playSFX("click");

    const totalEffect = selected.reduce(
      (acc, ing) => ({
        comfort:  acc.comfort  + ING_EFFECTS[ing].comfort,
        pressure: acc.pressure + ING_EFFECTS[ing].pressure,
        clarity:  acc.clarity  + ING_EFFECTS[ing].clarity,
      }),
      { comfort: 0, pressure: 0, clarity: 0 }
    );
    const newStats = {
      comfort:  Math.max(0, Math.min(20, stats.comfort  + totalEffect.comfort)),
      pressure: Math.max(0, Math.min(20, stats.pressure + totalEffect.pressure)),
      clarity:  Math.max(0, Math.min(20, stats.clarity  + totalEffect.clarity)),
    };

    const ingDisplay = selected.map(ing => currentIngInfo[ing]);
    setShowSteam(true);
    setShowTeaPanel(false);
    setTimeout(() => setShowSteam(false), 2200);
    setHistory(prev => [...prev, { type: "player", text: response.text, ingredients: [...selected], ingDisplay }]);
    setStats(newStats);
    setSelected([]);
    setExchangeCount(c => c + 1);

    if (response.next === "FINAL") {
      setTimeout(() => determineEnding(newStats), 1800);
      return;
    }
    const nextNode = NODES[response.next];
    if (!nextNode) return;
    setNodeId(response.next);
    setTimeout(() => {
      typeText(nextNode.mira, () => {
        setHistory(prev => [...prev, { type: "mira", text: nextNode.mira }]);
        setTypedText("");
        setShowTeaPanel(true);
      });
    }, 2400);
  };

  const determineEnding = (s) => {
    playTrack(MUSIC.credits, false); // ending music
    setScreen("ending");
    if (s.clarity < 6)             setEnding("missed");
    else if (s.comfort >= s.pressure + 1) setEnding("stays");
    else                           setEnding("leaves");
  };

  const restart = useCallback(() => {
    playTrack(MUSIC.title, true);
    setScreen("title");
    setNodeId("open1");
    setStats({ comfort: 4, pressure: 0, clarity: 0 });
    setHistory([]);
    setExchangeCount(0);
    setEnding(null);
    setSelected([]);
    setShowTeaPanel(false);
    setNarrationDone(false);
    setTypedText("");
  }, [playTrack]);

  // Auto-return to title when credits track finishes
  useEffect(() => {
    if (screen !== "credits") return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener("ended", restart);
    return () => audio.removeEventListener("ended", restart);
  }, [screen, restart]);

  // --- SHARED STYLES ---
  const containerStyle = {
    width: "100%",
    height: "100svh",
    fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
    color: "#d4c5a0",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const bgGradient =
    screen === "playing" || screen === "narration"
      ? `linear-gradient(180deg,
          rgba(${10 + progress * 8},${14 + progress * 10},${26 + progress * 14},1) 0%,
          rgba(${17 + progress * 10},${24 + progress * 12},${36 + progress * 16},1) 30%,
          rgba(26,21,16,1) 100%)`
      : "linear-gradient(180deg, #0a0e1a 0%, #141c2e 40%, #1a1510 100%)";

  // Settings gear — rendered on every screen
  const SettingsOverlay = (
    <>
      <button
        onClick={() => { playSFX("click"); setShowSettings(s => !s); }}
        style={{
          position: "fixed", top: "10px", right: "14px", zIndex: 200,
          background: "transparent",
          border: "1px solid rgba(220,170,80,0.2)",
          color: "rgba(220,170,80,0.45)",
          width: "30px", height: "30px", borderRadius: "50%",
          cursor: "pointer", fontSize: "15px",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s ease",
          fontFamily: "inherit",
        }}
        title="Settings"
      >
        ⚙
      </button>
      {showSettings && (
        <SettingsPanel
          volumes={volumes}
          onChange={(key, val) => setVolumes(v => ({ ...v, [key]: val }))}
          onClose={() => setShowSettings(false)}
          onQuit={() => { playSFX("click"); setShowQuitConfirm(true); }}
        />
      )}
      {showQuitConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(4,7,12,0.82)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(6px)",
        }}>
          <div style={{
            background: "rgba(10,14,22,0.98)",
            border: "1px solid rgba(220,170,80,0.15)",
            borderRadius: "10px", padding: "32px 36px",
            maxWidth: "300px", textAlign: "center",
            animation: "fadeInLine 0.2s ease",
          }}>
            <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(190,180,160,0.72)", marginBottom: "24px", fontStyle: "italic" }}>
              Your progress will be reset.<br />Return to the title screen?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => { playSFX("click"); setShowQuitConfirm(false); setShowSettings(false); restart(); }}
                style={{ ...titleButtonStyle, fontSize: "11px", padding: "9px 22px" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.7)"; e.currentTarget.style.background = "rgba(220,170,80,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.3)"; e.currentTarget.style.background = "transparent"; }}
              >
                Yes, quit
              </button>
              <button onClick={() => { playSFX("click"); setShowQuitConfirm(false); }}
                style={{ ...titleButtonStyle, fontSize: "11px", padding: "9px 22px", borderColor: "rgba(150,150,150,0.18)", color: "rgba(150,150,150,0.5)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(150,150,150,0.4)"; e.currentTarget.style.color = "rgba(150,150,150,0.8)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(150,150,150,0.18)"; e.currentTarget.style.color = "rgba(150,150,150,0.5)"; }}
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // --- TITLE ---
  if (screen === "title") {
    return (
      <div style={{
        ...containerStyle, background: bgGradient,
        alignItems: "center", justifyContent: "center",
        opacity: fadeIn ? 1 : 0, transition: "opacity 2s ease",
      }}>
        {SettingsOverlay}
        <RainLayer drops={rainDrops} />
        <div style={{
          position: "absolute", bottom: "18%", left: "50%",
          transform: "translateX(-50%)", width: "320px", height: "220px",
          background: "radial-gradient(ellipse, rgba(220,170,80,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ textAlign: "center", zIndex: 2, padding: "0 24px" }}>
          <div style={{ fontSize: "12px", letterSpacing: "6px", textTransform: "uppercase", color: "rgba(150,170,210,0.5)", marginBottom: "22px" }}>
            A story told over tea
          </div>
          <h1 style={{
            fontSize: "clamp(34px,7vw,56px)", fontWeight: "normal", fontStyle: "italic",
            margin: "0 0 8px 0", color: "#e8d9b4",
            textShadow: "0 0 50px rgba(220,170,80,0.25)", lineHeight: 1.15,
          }}>
            4:00 AM Tea
          </h1>
          <div style={{ fontSize: "clamp(14px,3vw,18px)", color: "rgba(150,170,210,0.6)", fontStyle: "italic", marginBottom: "22px" }}>
            The Final Train
          </div>

          <TitleIllustration />

          <button onClick={() => { playSFX("click"); startGame(); }}
            style={{ ...titleButtonStyle, marginTop: "22px" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.7)"; e.currentTarget.style.background = "rgba(220,170,80,0.08)"; e.currentTarget.style.color = "#f0dfb0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.3)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#d4c5a0"; }}
          >
            Open the door
          </button>

          <button onClick={() => { playSFX("click"); playTrack(MUSIC.credits, false); setScreen("credits"); }}
            style={{
              ...titleButtonStyle,
              marginTop: "14px",
              fontSize: "10px", padding: "9px 28px", letterSpacing: "3px",
              borderColor: "rgba(150,170,210,0.18)", color: "rgba(150,170,210,0.4)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(150,170,210,0.5)"; e.currentTarget.style.color = "rgba(150,170,210,0.85)"; e.currentTarget.style.background = "rgba(150,170,210,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(150,170,210,0.18)"; e.currentTarget.style.color = "rgba(150,170,210,0.4)"; e.currentTarget.style.background = "transparent"; }}
          >
            Credits
          </button>
          <div style={{ marginTop: "28px", fontSize: "11px", color: "rgba(150,170,210,0.22)", letterSpacing: "2px", fontStyle: "italic" }}>
            It's raining outside.
          </div>
        </div>
        <Keyframes />
      </div>
    );
  }

  // --- NARRATION ---
  if (screen === "narration") {
    return (
      <div style={{ ...containerStyle, background: bgGradient, alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        {SettingsOverlay}
        <RainLayer drops={rainDrops} />
        <div style={{ maxWidth: "480px", zIndex: 2, textAlign: "center" }}>
          <DoorScene />
          <p style={{ fontSize: "17px", lineHeight: 2.1, color: "rgba(190,180,160,0.78)", fontStyle: "italic", margin: 0 }}>
            {typedText}
            {isTyping && <Cursor />}
          </p>
          {isTyping && (
            <button onClick={skipTyping}
              style={{ ...skipBtnStyle, marginTop: "20px" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(220,170,80,0.6)"; e.currentTarget.style.borderColor = "rgba(220,170,80,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(150,150,150,0.35)"; e.currentTarget.style.borderColor = "rgba(150,150,150,0.15)"; }}
            >
              Skip ›
            </button>
          )}
          {narrationDone && (
            <button onClick={() => { playSFX("click"); enterKitchen(); }}
              style={{ ...titleButtonStyle, marginTop: "40px", fontSize: "12px", padding: "12px 32px", animation: "fadeInLine 1.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.7)"; e.currentTarget.style.background = "rgba(220,170,80,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.3)"; e.currentTarget.style.background = "transparent"; }}
            >
              Sit with her
            </button>
          )}
        </div>
        <Keyframes />
      </div>
    );
  }

  // --- CREDITS ---
  if (screen === "credits") {
    return (
      <div style={{
        ...containerStyle,
        background: "linear-gradient(180deg, #070a12 0%, #0d1020 50%, #0a0d18 100%)",
        alignItems: "center", justifyContent: "flex-end",
      }}>
        {SettingsOverlay}
        <RainLayer drops={rainDrops.slice(0, 30)} />
        <div style={{ flex: 1, width: "100%", overflow: "hidden", position: "relative" }}>
          <div style={{
            position: "absolute", width: "100%",
            animation: "creditsRoll 60s linear forwards",
            textAlign: "center", padding: "0 32px",
          }}>
            <p style={creditsTagline}>4:00 AM Tea</p>
            <p style={{ ...creditsTagline, fontSize: "12px", color: "rgba(150,170,210,0.35)", marginBottom: "80px" }}>The Final Train</p>

            <p style={creditsRole}>Written &amp; Directed by</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>
            <p style={{ fontSize: "11px", color: "rgba(150,170,210,0.35)", letterSpacing: "2px", margin: "0 0 80px 0" }}>sxj5604@psu.edu</p>

            <p style={creditsRole}>Executive Producer</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>Game Director</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>Lead Designer</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>Narrative Designer</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>Art Director</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>UI / UX Designer</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>QA &amp; Playtesting</p>
            <p style={creditsName}>Shoubhit Jamadhiar</p>

            <div style={{ height: "80px" }} />
            <p style={creditsRole}>Story Consultant</p>
            <p style={creditsName}>ChatGPT</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>Sound Design</p>
            <p style={creditsName}>Gemini</p>

            <div style={{ height: "50px" }} />
            <p style={creditsRole}>Engineering &amp; Implementation</p>
            <p style={creditsName}>Claude</p>

            <div style={{ height: "80px" }} />
            <p style={{ ...creditsRole, color: "rgba(150,170,210,0.2)", fontSize: "10px" }}>Made for IST 130 · Spring 2026</p>
            <div style={{ height: "60vh" }} />
          </div>
        </div>
        <div style={{ padding: "16px", zIndex: 3, display: "flex", gap: "16px", justifyContent: "center" }}>
          <button onClick={() => { playSFX("click"); restart(); }}
            style={{ ...titleButtonStyle, fontSize: "11px", padding: "10px 28px", borderColor: "rgba(220,170,80,0.2)", color: "rgba(220,170,80,0.5)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.5)"; e.currentTarget.style.color = "rgba(220,170,80,0.85)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.2)"; e.currentTarget.style.color = "rgba(220,170,80,0.5)"; }}
          >
            Return to menu
          </button>
        </div>
        <Keyframes />
      </div>
    );
  }

  // --- ENDINGS ---
  if (screen === "ending") {
    const endingData = {
      stays: {
        label: "She stays",
        bg: "linear-gradient(180deg, #0c0e16 0%, #1a1510 50%, #1f1a0e 100%)",
        accent: "rgba(220,170,80,0.5)",
        lines: [
          "The kettle whistles, sharp against the rain. You both flinch — then laugh, just a little.",
          "Mira looks at the clock. 5:12 AM.",
          "She doesn't stand up.",
          '"Can I use your phone? I think I should call a cab."',
          "She says it quietly, like she's afraid of the words.",
          "You slide your phone across the table.",
          "The rain starts to ease.",
          "She dials. Waits. Speaks softly.",
          '"Hey. It\'s me. I\'m coming home."',
        ],
      },
      leaves: {
        label: "She leaves",
        bg: "linear-gradient(180deg, #0a0c14 0%, #0e1220 50%, #0a0e18 100%)",
        accent: "rgba(140,160,200,0.5)",
        lines: [
          "The kettle whistles. Mira flinches. Looks at the clock.",
          "5:08 AM.",
          "She stands. Picks up her backpack. The chair scrapes the floor.",
          '"I should go. The train won\'t wait."',
          "She doesn't look at you.",
          "She walks to the door. Stops with her hand on the frame.",
          '"Thanks for the tea."',
          "The door closes. The rain fills the silence.",
          "You sit alone with two mugs. One still full.",
        ],
      },
      missed: {
        label: "Neither, exactly",
        bg: "linear-gradient(180deg, #0c0f18 0%, #15182a 50%, #1a1812 100%)",
        accent: "rgba(180,170,160,0.5)",
        lines: [
          "The kettle whistles. Mira looks at the clock.",
          "5:14 AM. Then 5:15. Then 5:16.",
          "She doesn't move.",
          "She stares at the rain on the window for a long time.",
          '"I didn\'t know I wasn\'t going to leave until I didn\'t."',
          "She picks up her tea. It's cold now.",
          '"Can I stay tonight? Just tonight. I don\'t know about tomorrow."',
          "You nod.",
          "Outside, a train horn sounds, faint, then gone.",
          "Neither of you say anything for a while.",
        ],
      },
    };

    const data = endingData[ending];

    return (
      <div style={{ ...containerStyle, background: data.bg, alignItems: "center", justifyContent: "center", padding: "40px 22px" }}>
        {SettingsOverlay}
        <RainLayer drops={rainDrops.slice(0, ending === "stays" ? 22 : ending === "missed" ? 35 : 55)} />
        <div style={{ maxWidth: "460px", textAlign: "center", zIndex: 2, overflowY: "auto", maxHeight: "100%" }}>
          <div style={{ fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase", color: data.accent, marginBottom: "32px", animation: "fadeInLine 0.8s ease" }}>
            {data.label}
          </div>
          <EndingIllustration type={ending} />
          {data.lines.map((line, i) => (
            <p key={i} style={{
              fontSize: "15px", lineHeight: 1.85,
              color: line.startsWith('"') ? "#e8d9b4" : "rgba(180,170,150,0.65)",
              fontStyle: line.startsWith('"') ? "italic" : "normal",
              margin: "0 0 14px 0",
              animation: `fadeInLine 0.9s ease ${i * 0.65 + 0.6}s backwards`,
            }}>
              {line}
            </p>
          ))}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "40px", animation: `fadeInLine 0.9s ease ${data.lines.length * 0.65 + 1.2}s backwards` }}>
            <button onClick={() => { playSFX("click"); restart(); }}
              style={{ ...titleButtonStyle, padding: "10px 24px", fontSize: "11px", borderColor: "rgba(220,170,80,0.2)", color: "rgba(220,170,80,0.55)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.5)"; e.currentTarget.style.color = "rgba(220,170,80,0.85)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(220,170,80,0.2)"; e.currentTarget.style.color = "rgba(220,170,80,0.55)"; }}
            >
              Begin again
            </button>
            <button onClick={() => { playSFX("click"); playTrack(MUSIC.credits, false); setScreen("credits"); }}
              style={{ ...titleButtonStyle, padding: "10px 24px", fontSize: "11px", borderColor: "rgba(150,170,210,0.2)", color: "rgba(150,170,210,0.45)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(150,170,210,0.45)"; e.currentTarget.style.color = "rgba(150,170,210,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(150,170,210,0.2)"; e.currentTarget.style.color = "rgba(150,170,210,0.45)"; }}
            >
              Credits
            </button>
          </div>
        </div>
        <Keyframes />
      </div>
    );
  }

  // --- MAIN GAME ---
  const previewResponse = getResponse();

  return (
    <div style={{ ...containerStyle, background: bgGradient }}>
      {SettingsOverlay}
      <RainLayer drops={rainDrops} />

      {showThunder && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(190,210,240,0.05)", zIndex: 1, pointerEvents: "none" }} />
      )}

      {showSteam && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 70%, rgba(230,210,170,0.12) 0%, transparent 50%)",
          zIndex: 4, pointerEvents: "none", animation: "steamGlow 2.2s ease",
        }}>
          {steamParticles.map(p => <SteamParticle key={p.id} {...p} />)}
        </div>
      )}

      {/* Header bar — right padding leaves room for the fixed ⚙ button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 52px 10px 20px", zIndex: 3, borderBottom: "1px solid rgba(220,170,80,0.06)" }}>
        <div style={{ fontSize: "13px", color: "rgba(150,170,210,0.5)", letterSpacing: "2px", fontVariantNumeric: "tabular-nums" }}>
          {timeStr}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "11px", color: `rgba(220,${170 - progress * 80},${80 - progress * 50},${0.35 + progress * 0.45})`, letterSpacing: "1.5px", fontStyle: "italic" }}>
            {kettleLabel}
          </div>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: `rgba(220,${170 - progress * 100},60,${0.35 + progress * 0.55})`,
            animation: progress > 0.5 ? "pulse 1.4s ease infinite" : "none",
            boxShadow: progress > 0.7 ? "0 0 8px rgba(220,140,60,0.5)" : "none",
          }} />
        </div>
      </div>

      {/* Dialogue scroll area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px 14px", zIndex: 2, scrollBehavior: "smooth", position: "relative" }}>
        {history.map((entry, i) => (
          <div key={i} style={{ marginBottom: "20px", animation: "fadeInLine 0.6s ease" }}>
            {entry.type === "narration" && (
              <p style={{ fontSize: "13px", lineHeight: 1.95, color: "rgba(180,170,150,0.5)", fontStyle: "italic", textAlign: "center", maxWidth: "420px", margin: "0 auto 8px" }}>
                {entry.text}
              </p>
            )}
            {entry.type === "mira" && (
              <div>
                <div style={{ ...miraLabel, display: "flex", alignItems: "center" }}><MiraAvatar />Mira</div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(195,205,225,0.85)", margin: 0, fontStyle: "italic" }}>
                  {entry.text}
                </p>
              </div>
            )}
            {entry.type === "player" && (
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-block", maxWidth: "88%" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "rgba(220,170,80,0.4)", marginBottom: "4px", textAlign: "right" }}>
                    {(entry.ingDisplay || []).map(d => d.emoji).join(" ")}{" "}
                    {entry.ingDisplay?.length === 1 ? entry.ingDisplay[0].label : "Blend"}
                  </div>
                  <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#d4c5a0", margin: 0, textAlign: "right" }}>
                    {entry.text}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && typedText && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ ...miraLabel, display: "flex", alignItems: "center" }}><MiraAvatar />Mira</div>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(195,205,225,0.85)", margin: 0, fontStyle: "italic" }}>
              {typedText}<Cursor />
            </p>
          </div>
        )}

        {/* Skip button — floats bottom-right of scroll area while typing */}
        {isTyping && (
          <div style={{ position: "sticky", bottom: "4px", textAlign: "right", pointerEvents: "none" }}>
            <button onClick={skipTyping}
              style={{ ...skipBtnStyle, pointerEvents: "all" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(220,170,80,0.65)"; e.currentTarget.style.borderColor = "rgba(220,170,80,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(150,150,150,0.35)"; e.currentTarget.style.borderColor = "rgba(150,150,150,0.15)"; }}
            >
              Skip ›
            </button>
          </div>
        )}
      </div>

      {/* Tea panel */}
      {showTeaPanel && (
        <div style={{ padding: "14px 18px 18px", borderTop: "1px solid rgba(220,170,80,0.08)", background: "linear-gradient(0deg, rgba(15,12,8,0.96) 0%, rgba(15,12,8,0.78) 100%)", zIndex: 3, animation: "slideUp 0.5s ease" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: "rgba(220,170,80,0.32)", marginBottom: "12px", textAlign: "center", fontStyle: "italic" }}>
            {ING_STAGE_LABELS[currentStage]}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            {Object.entries(currentIngInfo).map(([key, info]) => {
              const isSelected = selected.includes(key);
              return (
                <button key={key}
                  onClick={() => { playSFX("click"); toggleIng(key); }}
                  style={{
                    background: isSelected ? "rgba(220,170,80,0.13)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? "rgba(220,170,80,0.45)" : "rgba(220,170,80,0.1)"}`,
                    borderRadius: "8px", padding: "9px 14px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                    transition: "all 0.3s ease", minWidth: "92px",
                    boxShadow: isSelected ? "0 0 12px rgba(220,170,80,0.15)" : "none",
                    transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{info.emoji}</span>
                  <span style={{ fontSize: "11px", color: isSelected ? "#e8d9b4" : "rgba(220,170,80,0.55)", letterSpacing: "1px" }}>{info.label}</span>
                  <span style={{ fontSize: "9px", color: "rgba(150,150,150,0.4)" }}>{info.desc}</span>
                </button>
              );
            })}
          </div>
          {selected.length === 0 && (
            <div style={{ fontSize: "10px", color: "rgba(150,150,150,0.35)", textAlign: "center", marginBottom: "10px", fontStyle: "italic", letterSpacing: "1px" }}>
              one ingredient · or two · or all three
            </div>
          )}
          {selected.length > 0 && previewResponse && (
            <div style={{ textAlign: "center", marginBottom: "10px", padding: "9px 12px", background: "rgba(220,170,80,0.04)", borderRadius: "6px", border: "1px solid rgba(220,170,80,0.08)" }}>
              <p style={{ fontSize: "13.5px", color: "rgba(220,200,160,0.78)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                "{previewResponse.text}"
              </p>
            </div>
          )}
          <button onClick={offerTea} disabled={selected.length === 0}
            style={{
              display: "block", width: "100%", maxWidth: "200px", margin: "0 auto",
              background: selected.length > 0 ? "rgba(220,170,80,0.14)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${selected.length > 0 ? "rgba(220,170,80,0.35)" : "rgba(100,100,100,0.15)"}`,
              color: selected.length > 0 ? "#d4c5a0" : "rgba(150,150,150,0.3)",
              padding: "9px 20px", fontSize: "11.5px", fontFamily: "inherit",
              cursor: selected.length > 0 ? "pointer" : "default",
              letterSpacing: "2.5px", textTransform: "uppercase",
              borderRadius: "5px", transition: "all 0.3s ease",
            }}
          >
            Offer the cup
          </button>
        </div>
      )}

      <Keyframes />
    </div>
  );
}

// --- HELPERS ---
function RainLayer({ drops }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {drops.map(r => <RainDrop key={r.id} {...r} />)}
    </div>
  );
}

function Cursor() {
  return (
    <span style={{
      display: "inline-block", width: "2px", height: "14px",
      background: "rgba(220,170,80,0.55)", marginLeft: "3px",
      animation: "blink 1s step-end infinite", verticalAlign: "text-bottom",
    }} />
  );
}

const miraLabel = {
  fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase",
  color: "rgba(150,170,210,0.4)", marginBottom: "5px",
};

const titleButtonStyle = {
  background: "transparent",
  border: "1px solid rgba(220,170,80,0.3)",
  color: "#d4c5a0",
  padding: "13px 38px",
  fontSize: "13px",
  fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  cursor: "pointer",
  letterSpacing: "3px",
  textTransform: "uppercase",
  transition: "all 0.5s ease",
  fontStyle: "italic",
};

const skipBtnStyle = {
  background: "transparent",
  border: "1px solid rgba(150,150,150,0.15)",
  color: "rgba(150,150,150,0.35)",
  padding: "4px 10px",
  fontSize: "10px",
  fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  cursor: "pointer",
  letterSpacing: "1.5px",
  borderRadius: "4px",
  transition: "all 0.25s ease",
  fontStyle: "italic",
};

const creditsRole = {
  fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase",
  color: "rgba(150,170,210,0.35)", margin: "0 0 10px 0",
};

const creditsName = {
  fontSize: "22px", fontWeight: "normal", fontStyle: "italic",
  color: "rgba(220,200,165,0.75)", margin: "0 0 6px 0",
  textShadow: "0 0 30px rgba(220,170,80,0.15)",
};

const creditsTagline = {
  fontSize: "28px", fontWeight: "normal", fontStyle: "italic",
  color: "rgba(220,200,165,0.55)", margin: "0 0 8px 0",
};

function Keyframes() {
  return (
    <style>{`
      @keyframes rainFall {
        0% { transform: translateY(-10px); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }
      @keyframes blink { 50% { opacity: 0; } }
      @keyframes fadeInLine {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      @keyframes steamRise {
        0%   { transform: translateY(0) scale(0.6); opacity: 0; }
        20%  { opacity: 0.7; }
        100% { transform: translateY(-180px) scale(2.5); opacity: 0; }
      }
      @keyframes steamGlow {
        0%   { opacity: 0; }
        30%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes creditsRoll {
        from { transform: translateY(100vh); }
        to   { transform: translateY(-100%); }
      }
      div::-webkit-scrollbar { width: 4px; }
      div::-webkit-scrollbar-track { background: transparent; }
      div::-webkit-scrollbar-thumb { background: rgba(220,170,80,0.18); border-radius: 2px; }
      .tea-slider {
        -webkit-appearance: none;
        appearance: none;
        height: 2px;
        background: rgba(220,170,80,0.18);
        border-radius: 2px;
        outline: none;
      }
      .tea-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 13px; height: 13px;
        border-radius: 50%;
        background: rgba(220,170,80,0.65);
        cursor: pointer;
        border: 1px solid rgba(220,170,80,0.3);
        transition: background 0.2s ease;
      }
      .tea-slider::-webkit-slider-thumb:hover {
        background: rgba(220,170,80,0.9);
      }
      .tea-slider::-moz-range-thumb {
        width: 13px; height: 13px;
        border-radius: 50%;
        background: rgba(220,170,80,0.65);
        cursor: pointer;
        border: 1px solid rgba(220,170,80,0.3);
      }
    `}</style>
  );
}

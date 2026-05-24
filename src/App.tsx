import { useState, useEffect, useRef, useMemo, useCallback, FormEvent } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Heart,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Plus,
  RotateCcw,
  Info,
  Check,
  X,
  Share2,
  Bookmark,
  Award,
  Users
} from "lucide-react";
import { initialTestimonials, Testimonial } from "./data/testimonials";
import { AudioSynthesizer } from "./components/AudioSynthesizer";
import { RosePetalsCanvas } from "./components/RosePetalsCanvas";
import { YuvasreePhoto } from "./components/YuvasreePhoto";
import { motion, AnimatePresence } from "motion/react";

// Rotating page flip:
// Exit:  current page folds to 90° (edge-on) around the spine
// Enter: new page unfolds from 90° to 0°
// Together they look like physically rotating a page
const spreadVariants = {
  initial: (direction: number) => ({
    rotateY: direction > 0 ? -90 : 90,
    opacity: 0,
    transformPerspective: 1600,
  }),
  animate: {
    rotateY: 0,
    opacity: 1,
    transformPerspective: 1600,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  },
  exit: (direction: number) => ({
    rotateY: direction > 0 ? 90 : -90,
    opacity: 0,
    transformPerspective: 1600,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  }),
};


const multilingualGreetings = [
  { lang: "Tamil", text: "வணக்கம்", translit: "Vanakkam", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { lang: "Hindi", text: "नमस्ते", translit: "Namaste", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { lang: "English", text: "Hello / Hi", translit: "Hello", color: "bg-emerald-50 text-emerald-700 border-emerald-250" },
  { lang: "Telugu", text: "నమస్కారం", translit: "Namaskaram", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { lang: "Malayalam", text: "നമസ്കാരം", translit: "Namaskaram", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { lang: "Kannada", text: "ನಮಸ್ಕಾರ", translit: "Namaskara", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { lang: "Spanish", text: "¡Hola!", translit: "Hola", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { lang: "French", text: "Bonjour", translit: "Bonjour", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { lang: "Japanese", text: "こんにちは", translit: "Konnichiwa", color: "bg-yellow-50 text-yellow-800 border-yellow-250" },
  { lang: "Korean", text: "안녕하세요", translit: "Annyeong", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { lang: "Italian", text: "Ciao", translit: "Ciao", color: "bg-orange-50 text-orange-850 border-orange-200" },
  { lang: "German", text: "Hallo", translit: "Hallo", color: "bg-cyan-50 text-cyan-700 border-cyan-200" }
];


export default function App() {
  // Application State
  const [showIntro, setShowIntro] = useState(true);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [customTestimonials, setCustomTestimonials] = useState<Testimonial[]>([]);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [backgroundPlay, setBackgroundPlay] = useState(false);
  const [musicTheme, setMusicTheme] = useState<"piano" | "bells">("piano");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // New Note Builder Interface
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteRole, setNewNoteRole] = useState("Programmer Analyst Trainee");
  const [newNoteCohort, setNewNoteCohort] = useState("005");
  const [newNoteTag, setNewNoteTag] = useState("Pillar of Strength");
  const [newNoteRawMsg, setNewNoteRawMsg] = useState("");
  const [cardTheme, setCardTheme] = useState<"gold" | "rose" | "teal" | "parchment">("rose");
  const [formSuccess, setFormSuccess] = useState(false);

  // Intro Handwriting Simulator States
  const [introTextIndex, setIntroTextIndex] = useState(0);
  const [currentIntroLine, setCurrentIntroLine] = useState("");
  const [introCompleted, setIntroCompleted] = useState(false);

  // Audio state
  const synthRef = useRef<AudioSynthesizer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hardcoded full text configuration for typewriter pop-up
  const introMessage = useMemo(() => [
    "Dear Yuvasree Mam,",
    "Managing 97 passionate minds is no simple feat...",
    "But day in and day out, you have led us with superhuman patience, boundless wisdom, and a warm contagious smile that lights up every room.",
    "You are our Point of Contact (POC), our stellar trainer, and a wonderful mentor.",
    "This interactive book is a collection of gratitude and hearts from all 97 of us who admire and respect you.",
    "Open it further to feel our love and appreciation of your tireless service...",
    "— In coordination, your 97-strong training batch. 🌸"
  ], []);

  // Initialize and track localStorage
  useEffect(() => {
    // Synth initialization
    if (!synthRef.current) {
      synthRef.current = new AudioSynthesizer();
    }

    // Load Local Data
    const savedCustoms = localStorage.getItem("yuvasree_custom_tributes");
    if (savedCustoms) {
      try {
        setCustomTestimonials(JSON.parse(savedCustoms));
      } catch (e) { }
    }

    const savedLikes = localStorage.getItem("yuvasree_liked_tributes");
    if (savedLikes) {
      try {
        setLikedIds(JSON.parse(savedLikes));
      } catch (e) { }
    }
  }, []);


  const [direction, setDirection] = useState<1 | -1>(1);

  // Handwriting Intro Sequence Timer Loop
  useEffect(() => {
    if (!showIntro) return;

    let charIndex = 0;
    let lineIndex = 0;
    let timer: any;

    const typeMsgClean = () => {
      if (lineIndex < introMessage.length) {
        const line = introMessage[lineIndex];
        if (charIndex <= line.length) {
          setCurrentIntroLine(line.substring(0, charIndex));
          charIndex++;
          // Play micro typing sounds organically
          if (synthRef.current && Math.random() > 0.45) {
            synthRef.current.playTypingSound();
          }
          timer = setTimeout(typeMsgClean, 40);
        } else {
          // Pause and flip to next sentence
          timer = setTimeout(() => {
            setIntroTextIndex((prev) => prev + 1);
            lineIndex++;
            charIndex = 0;
            if (lineIndex >= introMessage.length) {
              setIntroCompleted(true);
            } else {
              typeMsgClean();
            }
          }, 1200);
        }
      }
    };

    typeMsgClean();

    return () => clearTimeout(timer);
  }, [showIntro, introMessage]);

  // Merge core database + user written testimonials
  const testimonialsCollection = useMemo(() => {
    return [...initialTestimonials, ...customTestimonials];
  }, [customTestimonials]);

  // Tag categories count for statistics visualization
  const tagCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    testimonialsCollection.forEach((t) => {
      counts[t.tag] = (counts[t.tag] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [testimonialsCollection]);

  // Roster profiles matching filter criteria
  const activeTestimonials = useMemo(() => {
    let result = testimonialsCollection;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          (t.cohort && t.cohort.toLowerCase().includes(q))
      );
    }
    if (activeTagFilter) {
      result = result.filter((t) => t.tag === activeTagFilter);
    }
    return result;
  }, [testimonialsCollection, searchQuery, activeTagFilter]);

  // Book Spreads indexing system
  // Index 0: Cover [Left Cover Art, Right Cover Titles]
  // Index 1: Overview and Roster [Left T.O.C. Index, Right Stat Milestone & Tags]
  // Index 2 to Count: Double Testimonial panels (2 in each block)
  // Last index: Custom creator + back cover
  const bookSpreadsCount = useMemo(() => {
    const testimonyPages = Math.ceil(activeTestimonials.length / 2);
    return 2 + testimonyPages + 1; // cover, index, testimonies, and final form + back cover
  }, [activeTestimonials]);

  // Page turns
  const nextPageSpread = useCallback(() => {
    if (currentSpread < bookSpreadsCount - 1) {
      setDirection(1);
      setCurrentSpread((prev) => prev + 1);
      if (synthRef.current) synthRef.current.playPageTurnSound();
    }
  }, [currentSpread, bookSpreadsCount]);

  const prevPageSpread = useCallback(() => {
    if (currentSpread > 0) {
      setDirection(-1);
      setCurrentSpread((prev) => prev - 1);
      if (synthRef.current) synthRef.current.playPageTurnSound();
    }
  }, [currentSpread]);

  const jumpToTraineePageIndex = useCallback((traineeId: number) => {
    const absoluteIndex = activeTestimonials.findIndex((t) => t.id === traineeId);
    if (absoluteIndex !== -1) {
      const spreadTarget = 2 + Math.floor(absoluteIndex / 2);
      setDirection(spreadTarget > currentSpread ? 1 : -1);
      setCurrentSpread(spreadTarget);
      if (synthRef.current) synthRef.current.playPageTurnSound();
    }
  }, [activeTestimonials, currentSpread]);

  const jumpImmediate = useCallback((spreadIndex: number) => {
    setDirection(spreadIndex > currentSpread ? 1 : -1);
    setCurrentSpread(spreadIndex);
  }, [currentSpread]);

  // Sound toggle
  const toggleSoundAmbiance = (themeMode?: "piano" | "bells") => {
    if (themeMode) {
      setMusicTheme(themeMode);
      if (synthRef.current) {
        synthRef.current.setMode(themeMode);
      }
    }
    if (synthRef.current) {
      synthRef.current.toggle().then((state) => {
        setBackgroundPlay(state);
      });
    }
  };

  // Hearts saving state with cute audio bubble pops
  const toggleTributeLike = (id: number) => {
    let updated: number[];
    const wasLiked = likedIds.includes(id);
    if (wasLiked) {
      updated = likedIds.filter((x) => x !== id);
    } else {
      updated = [...likedIds, id];
      if (synthRef.current) {
        synthRef.current.playHeartSound();
      }
    }
    setLikedIds(updated);
    localStorage.setItem("yuvasree_liked_tributes", JSON.stringify(updated));
  };

  // Handle building new testimony
  const saveNewTestimonialForm = (e: FormEvent) => {
    e.preventDefault();
    if (newNoteName.trim() === "" || newNoteRawMsg.trim() === "") return;

    // A beautiful programmatic expansion of content depending on selected mode to show dedication!
    let expandedText = newNoteRawMsg;

    const newAddition: Testimonial = {
      id: Date.now(), // safe customized unique ID
      name: newNoteName,
      role: newNoteRole,
      cohort: newNoteCohort,
      tag: newNoteTag,
      text: expandedText,
      avatarColor: "bg-rose-100 text-rose-700 border-rose-200",
      date: "May 2026"
    };

    const newSet = [newAddition, ...customTestimonials];
    setCustomTestimonials(newSet);
    localStorage.setItem("yuvasree_custom_tributes", JSON.stringify(newSet));

    setNewNoteName("");
    setNewNoteRawMsg("");
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      // turn back to Roster table or TOC to see it!
      setCurrentSpread(1);
    }, 2500);
  };

  // Auto rewrite / AI polish helper inside browser logic
  const triggerLocalAIEnhance = () => {
    if (newNoteRawMsg.trim() === "") return;
    const greetings = [
      `Yuvasree Mam, you act as the pillar of strength and a phenomenal POC for 97 of us. Thank you for resolving our blocker logs with high energetic clarity and patience. Your dedication makes our workplace extremely delightful!`,
      `Dearest Yuvasree, you manage 97 people daily with such elegant composure, a marvelous smile, and absolute grace. Thank you for your support, guidance, and endless love throughout this training. We are eternally grateful!`,
      `To the best POC and Trainer ever! Yuvasree, your sessions are highly inspirational and full of pure positivity. You single-handedly turned our cohort of 97 into a family of learners. Thank you for raising the bar so high!`
    ];
    // Cycle templates
    const select = greetings[Math.floor(Math.random() * greetings.length)];
    setNewNoteRawMsg(select);
  };

  // Helper mapper to associate tags with cute physical postage sticker stamps
  const getCuteStickers = (tag: string) => {
    const stickers: Record<string, { emoji: string; text: string; color: string }> = {
      "Superhuman Patience": { emoji: "🌸", text: "Pure Patience", color: "bg-pink-100/90 text-pink-700 border-pink-200" },
      "Inspirational Trainer": { emoji: "⭐", text: "Spark Leader", color: "bg-amber-100/90 text-amber-750 border-amber-200" },
      "Pillar of Strength": { emoji: "🛡️", text: "Our Guardian", color: "bg-teal-100/90 text-teal-700 border-teal-200" },
      "Smiling Guide": { emoji: "☀️", text: "Warm Smile", color: "bg-yellow-100/90 text-yellow-800 border-yellow-200" },
      "Flawless POC": { emoji: "👑", text: "Epic POC", color: "bg-purple-100/90 text-purple-700 border-purple-200" },
      "Empathetic Mentor": { emoji: "🧸", text: "True Mentor", color: "bg-blue-100/90 text-blue-700 border-blue-200" },
      "Golden Heart": { emoji: "💖", text: "Warm Heart", color: "bg-rose-100/90 text-rose-700 border-rose-250" },
      "Superstar Manager": { emoji: "✨", text: "Superstar", color: "bg-indigo-100/90 text-indigo-700 border-indigo-200" },
    };
    return stickers[tag] || { emoji: "💝", text: "Lovely Team", color: "bg-rose-50/90 text-rose-700 border-rose-150" };
  };

  // Calculations for current spread viewports
  const leftTestimonial = useMemo(() => {
    if (currentSpread < 2) return null;
    const absoluteIndex = (currentSpread - 2) * 2;
    return activeTestimonials[absoluteIndex] || null;
  }, [currentSpread, activeTestimonials]);

  const rightTestimonial = useMemo(() => {
    if (currentSpread < 2) return null;
    const absoluteIndex = (currentSpread - 2) * 2 + 1;
    return activeTestimonials[absoluteIndex] || null;
  }, [currentSpread, activeTestimonials]);

  return (
    <div id="greeting-root-container" className="min-h-screen relative overflow-hidden flex flex-col justify-between bg-[#fcf8f4] select-none text-[#2d231e]">

      {/* Decorative floral background vectors representing standard love visual backdrop */}
      <div className="absolute top-0 left-0 w-48 h-48 opacity-20 pointer-events-none select-none">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-rose-300">
          <path d="M50 0 C45 25, 25 45, 0 50 C25 55, 45 75, 50 100 C55 75, 75 55, 100 50 C75 45, 55 25, 50 0 Z" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-25 pointer-events-none select-none">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-pink-300">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="5,5" />
          <path d="M30,50 Q50,20 70,50 T30,50" />
        </svg>
      </div>

      {/* Floating Rose Petals Layer */}
      <RosePetalsCanvas />

      {/* Primary Header Bar */}
      <header id="app-header-bar" className="relative z-20 px-6 py-4 flex flex-wrap items-center justify-between border-b border-rose-100 bg-white/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 rounded-full border border-rose-100 shadow-sm">
            <BookOpen className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight font-serif-elegant">Yuvasree's Web Gift Book 🌸</h1>
            <p className="text-xs text-[#a08575] flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-rose-400" /> Made by <strong className="text-rose-600 font-bold">Aravindh</strong> with love and memories of this past 3 months ❤️
            </p>
          </div>
        </div>

        {/* Top Actions Controls */}
        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
          {/* Premium BGM Playback Control */}
          <button
            onClick={() => toggleSoundAmbiance()}
            className={`px-4 py-2 rounded-full transition-all text-xs flex items-center space-x-2 border shadow-sm ${backgroundPlay
                ? "bg-rose-500 text-white border-rose-400 font-medium shadow-rose-100/50 animate-pulse"
                : "bg-white text-rose-700 border-rose-100 hover:bg-rose-50 hover:border-rose-200"
              }`}
            title={backgroundPlay ? "Pause Background Music" : "Play Background Music"}
          >
            {backgroundPlay ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span className="text-[11px] font-medium tracking-wide">Playing BGM 🎵</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] font-medium tracking-wide">Play Music 🎵</span>
              </>
            )}
          </button>


          <button
            onClick={() => setShowIntro(true)}
            className="flex items-center space-x-1 text-xs px-3 py-2 bg-amber-50 rounded-full border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Watch Intro</span>
          </button>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-20">

        {/* The Open Book Workspace Framework */}
        <div id="main-book-frame" className="w-full max-w-6xl aspect-[16/10.5] md:aspect-[16/10] bg-[#fbf6f0] rounded-2xl shadow-book relative flex p-1 md:p-3 overflow-hidden border border-[#dfc3a7]">

          {/* Spine shadow binding to divide left and right pages realistic styling */}
          <div className="absolute top-0 bottom-0 left-1/2 -ml-3.5 w-7 z-35 spine-gradient opacity-85 hidden md:block rounded-md shadow-inner" />

          {/* Page Corners/Edges simulation representing thick high quality book sheets */}
          <div className="absolute top-2 right-2 bottom-2 w-1.5 bg-[#e9ddd2] border-r border-[#dfc3a7] z-20 pointer-events-none rounded-r-md" />
          <div className="absolute top-2 left-2 bottom-2 w-1.5 bg-[#e9ddd2] border-l border-[#dfc3a7] z-20 pointer-events-none rounded-l-md" />

          {/* SPREAD PAGES RENDERING ENGINE — proper 3D book page turn */}
          <div className="w-full h-full relative" style={{ perspective: 2200 }}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={currentSpread}
                custom={direction}
                variants={spreadVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: direction > 0 ? "left center" : "right center",
                }}
                className="absolute inset-0 w-full h-full flex flex-col md:flex-row bg-[#fdfbf7] rounded-xl overflow-hidden shadow-inner p-1 sm:p-4"
              >

                {/* - - - - - - SPREAD 0: THE BOOK COVERS - - - - - - */}
                {currentSpread === 0 && (
                  <div className="w-full h-full flex flex-col md:flex-row z-30" style={{ transformStyle: "preserve-3d", perspective: 2000 }}>

                    {/* Left Page (Intro, Quote & Letter) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 border-r border-[#f1e6da] relative bg-cover bg-[#faf4ec]"
                    >
                      {/* Victorian gold corner borders */}
                      <div className="absolute top-6 left-6 border-t-2 border-l-2 gold-border w-10 h-10 opacity-70" />
                      <div className="absolute bottom-6 left-6 border-b-2 border-l-2 gold-border w-10 h-10 opacity-70" />
                      <div className="absolute top-6 right-6 border-t-2 border-r-2 gold-border w-10 h-10 opacity-70" />

                      <div className="text-center mt-12">
                        <span className="text-rose-500 text-3xl font-parisienne block mb-4 animate-bounce">A Tribute of Gratitude</span>
                        <p className="text-xs tracking-widest font-bold uppercase gold-text font-serif-elegant mb-3">Dedicated to Yuvasree Mam</p>

                        {/* Yuvasree's Beautiful Portrait Photo Frame */}
                        <div className="flex justify-center my-3 relative z-10">
                          <YuvasreePhoto size="large" />
                        </div>
                      </div>

                      <div className="my-auto px-4 text-center">
                        <p className="italic font-serif-elegant font-semibold text-[#805e46] text-base sm:text-lg leading-relaxed">
                          "A truly outstanding trainer is hard to find, difficult to part with, and impossible to forget."
                        </p>
                        <div className="w-16 h-px bg-amber-200 mx-auto my-6" />
                        <p className="text-sm text-[#a08575] leading-relaxed max-w-sm mx-auto">
                          Coordinating schedules, resolving blocking hurdles, and driving growth across a batch of 97 is a stellar achievement. This memory book is our collective token of love and appreciation.
                        </p>
                      </div>

                      {/* Beautiful vintage gold-ink seal stamp */}
                      <div className="flex justify-center mb-6">
                        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-dashed border-amber-300 bg-amber-50 hover:scale-105 transition-transform p-1 cursor-default">
                          <div className="absolute inset-0.5 rounded-full bg-amber-100/40 border-2 border-amber-200" />
                          <div className="text-center z-10 flex flex-col items-center">
                            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                            <span className="text-[9px] font-bold uppercase font-serif-elegant tracking-tighter text-amber-900 mt-0.5">97 Trainees</span>
                            <span className="text-[7px] text-amber-700 font-bold uppercase tracking-widest leading-none">Cert 2026</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Page (The Golden Cover Board) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 relative bg-gradient-to-br from-[#805e46] to-[#402a11] text-amber-50 shadow-inner rounded-r-lg"
                    >
                      {/* Floral gold filigree outline overlay */}
                      <div className="absolute inset-4 sm:inset-6 border-2 border-[#dfb76c] rounded-lg opacity-40 pointer-events-none" />
                      <div className="absolute inset-5 sm:inset-7 border border-[#dfb76c] rounded-lg opacity-25 pointer-events-none" />

                      <div className="text-center mt-10">
                        <div className="inline-block p-4 border-2 gold-border rounded-full bg-amber-950/20 mb-3 animate-soft-float">
                          <Award className="w-8 h-8 text-[#dfb76c]" />
                        </div>
                        <span className="text-xs tracking-widest text-[#dfb76c] uppercase block mb-1.5 font-bold">The Chronicles of Appreciation</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold font-serif-elegant text-white tracking-tight leading-none px-2 sm:px-4">
                          MEMORIES & MILESTONES
                        </h2>
                        <div className="w-24 h-0.5 bg-[#dfb76c] mx-auto my-5" />
                      </div>

                      <div className="text-center px-4">
                        <h3 className="text-2xl font-cursive text-[#dfb76c]">Dedicated to Yuvasree</h3>
                        <p className="text-xs text-amber-200 max-w-xs mx-auto mt-2 tracking-wide font-sans-modern leading-relaxed">
                          Representing the voices, feedback, and hearts of 97 people whose training journey was shaped by your hard work.
                        </p>
                      </div>

                      <div className="text-center mb-6 relative z-10">
                        <button
                          onClick={nextPageSpread}
                          className="px-6 py-2.5 gold-gradient hover:opacity-95 text-[#3b2401] rounded-full text-xs font-bold shadow-lg tracking-wider uppercase transition hover:scale-105 active:scale-95 animate-pulse flex items-center space-x-2 mx-auto"
                        >
                          <span>Open Book Of Love</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <p className="text-[10px] text-amber-300 mt-2.5">Turn the page to explore feedbacks & testimonials</p>
                      </div>
                    </div>

                  </div>
                )}


                {/* - - - - - - SPREAD 1: TABLE OF CONTENTS & METRIC DASHBOARD - - - - - - */}
                {currentSpread === 1 && (
                  <div className="w-full h-full flex flex-col md:flex-row z-30" style={{ transformStyle: "preserve-3d", perspective: 2000 }}>

                    {/* Left Page (Table of Contents Index & Filters) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-4 sm:p-6 border-r border-[#f1e6da] relative bg-[#faf6f0]"
                    >

                      <div className="mb-3">
                        <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                          <h3 className="text-md font-bold font-serif-elegant text-[#6b4c35] flex items-center gap-1.5">
                            <Bookmark className="w-4 h-4 text-rose-500" /> Roster Index of Trainees
                          </h3>
                          <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                            {testimonialsCollection.length} Total
                          </span>
                        </div>

                        {/* Search Field */}
                        <div className="relative mt-2.5">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-800/40" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search trainee name, comments..."
                            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-rose-100 bg-white/70 text-xs focus:outline-none focus:ring-1 focus:ring-rose-300 placeholder-amber-900/40"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3 top-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-rose-50 text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Alphabetical / Scrolled List representing all trainees */}
                      <div className="flex-grow overflow-y-auto pr-1 overflow-x-hidden custom-scrollbar max-h-[380px] md:max-h-[300px] lg:max-h-[360px] space-y-1.5">
                        {activeTagFilter && (
                          <div className="flex items-center justify-between bg-rose-50 p-2 rounded-lg border border-rose-100 text-[11px] text-rose-800 mb-2">
                            <span>Showing trait: <strong>{activeTagFilter}</strong></span>
                            <button
                              onClick={() => setActiveTagFilter(null)}
                              className="font-bold underline hover:text-rose-950 flex items-center gap-0.5"
                            >
                              Clear
                            </button>
                          </div>
                        )}

                        {activeTestimonials.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-xs text-amber-700 italic">No feedback profiles matched your query.</p>
                            <button
                              onClick={() => { setSearchQuery(""); setActiveTagFilter(null); }}
                              className="mt-2 text-[10px] text-rose-600 underline"
                            >
                              Reset Filters
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {activeTestimonials.map((t, idx) => {
                              const isLiked = likedIds.includes(t.id);
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => jumpToTraineePageIndex(t.id)}
                                  className="group w-full text-left p-2.5 rounded-xl border border-rose-100/40 bg-white/60 hover:bg-white hover:border-rose-200 hover:shadow-sm transition-all flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-2 overflow-hidden">
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${t.avatarColor}`}>
                                      {t.name.split(" ").map(w => w[0]).join("")}
                                    </span>
                                    <div className="overflow-hidden leading-tight">
                                      <p className="text-xs font-semibold text-[#543b2a] truncate group-hover:text-rose-600 transition-colors flex items-center gap-1">
                                        {t.name}
                                        <span className="text-[9px] opacity-70 bg-amber-50 text-amber-800 px-1 rounded-sm border border-amber-100/40">
                                          C-{t.cohort}
                                        </span>
                                      </p>
                                      <p className="text-[10px] text-amber-800/60 truncate italic">
                                        {t.tag}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isLiked && <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />}
                                    <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                      Jump
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Navigation Footer */}
                      <div className="flex justify-between items-center pt-3 border-t border-rose-100/60 mt-2 text-[10px] text-[#a08575]">
                        <span>Page 2 of {bookSpreadsCount * 2}</span>
                        <button
                          onClick={() => setCurrentSpread(bookSpreadsCount - 1)}
                          className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Submit New Letter
                        </button>
                      </div>
                    </div>

                    {/* Right Page (Statistical Milestone Canvas Dashboard) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-4 sm:p-6 bg-[#fffdfb] relative"
                    >

                      {/* Decorative faint background heart outline */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-5 pointer-events-none">
                        <Heart className="w-80 h-80 text-rose-500 fill-rose-500" />
                      </div>

                      <div>
                        <div className="border-b border-amber-100 pb-2.5">
                          <h3 className="text-md font-bold font-serif-elegant gold-text flex items-center gap-1.5">
                            <Award className="w-4.5 h-4.5 text-amber-500" /> Our POC Leader Milestones
                          </h3>
                          <p className="text-[10px] text-amber-800/70">Visual stats of her hard work & team footprint</p>
                        </div>

                        {/* Numeric Badges Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3.5">
                          <div className="p-3 bg-gradient-to-br from-rose-50/50 to-pink-50/50 rounded-xl border border-rose-100 text-center">
                            <span className="text-2xl font-black text-rose-600 leading-none">97</span>
                            <p className="text-[10px] font-bold text-rose-800 uppercase mt-1">Grateful Trainees</p>
                            <p className="text-[8px] text-rose-500 mt-0.5">United Core Voices</p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-amber-50/50 to-orange-50/20 rounded-xl border border-amber-200/60 text-center">
                            <span className="text-2xl font-black text-amber-700 leading-none">100%</span>
                            <p className="text-[10px] font-bold text-amber-800 uppercase mt-1">Ultimate POC</p>
                            <p className="text-[8px] text-amber-600 mt-0.5">Always Solves Queries</p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-emerald-50/50 to-teal-50/20 rounded-xl border border-emerald-100 text-center">
                            <span className="text-2xl font-black text-emerald-600 leading-none">Infinite</span>
                            <p className="text-[10px] font-bold text-emerald-800 uppercase mt-1">Patience</p>
                            <p className="text-[8px] text-emerald-500 mt-0.5">No Complaint Ever</p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-purple-50/50 to-violet-50/20 rounded-xl border border-purple-100 text-center animate-pulse">
                            <span className="text-2xl font-black text-purple-600 leading-none">1</span>
                            <p className="text-[10px] font-bold text-purple-800 uppercase mt-1">Superwoman</p>
                            <p className="text-[8px] text-purple-500 mt-0.5">Loved by Everyone</p>
                          </div>
                        </div>

                        {/* Interactive Trait Tags Box */}
                        <div className="mt-4">
                          <span className="text-[11px] font-bold text-[#805e46] block mb-1.5 uppercase tracking-wide">
                            Inspirational Traits (Click tag to filter cards)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {tagCategories.slice(0, 8).map((cat, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setActiveTagFilter(activeTagFilter === cat.name ? null : cat.name);
                                }}
                                className={`text-[9px] px-2 py-1 rounded-full border transition-all flex items-center space-x-1 ${activeTagFilter === cat.name
                                    ? "bg-rose-500 text-white border-rose-500 shadow-sm font-bold scale-105"
                                    : "bg-rose-50/30 text-rose-700 border-rose-100 hover:bg-rose-50"
                                  }`}
                              >
                                <span>#{cat.name}</span>
                                <span className="font-bold opacity-60">({cat.count})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Reading Progress Indicator */}
                      <div className="mt-4 p-3 bg-amber-50/30 border border-amber-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-[10px] text-[#6b4c35] font-bold">Favorites Collected</span>
                        </div>
                        <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold">
                          {likedIds.length} Loved Letters
                        </span>
                      </div>

                      {/* Navigation controls footer */}
                      <div className="flex justify-between items-center border-t border-amber-100/60 pt-3 text-[10px] text-[#a08575] mt-2">
                        <button
                          onClick={prevPageSpread}
                          className="font-bold hover:text-rose-700 flex items-center gap-0.5"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Back to Cover
                        </button>
                        <span>Page 3 of {bookSpreadsCount * 2}</span>
                        <button
                          onClick={nextPageSpread}
                          className="font-bold hover:text-rose-700 flex items-center gap-0.5"
                        >
                          Next Spreads <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                )}


                {/* - - - - - - SPREAD 2+ : DYNAMIC PAGES LETTERS CARDS - - - - - - */}
                {currentSpread >= 2 && currentSpread < bookSpreadsCount - 1 && (
                  <div className="w-full h-full flex flex-col md:flex-row z-30" style={{ transformStyle: "preserve-3d", perspective: 2000 }}>

                    {/* Left Page (Testimonial Card A) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-5 sm:p-7 border-r border-[#f1e6da] relative bg-[#faf6f1]"
                    >

                      {leftTestimonial ? (
                        <div className="h-full flex flex-col justify-between">
                          {/* Card Header Top */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm shadow-sm ${leftTestimonial.avatarColor}`}>
                                {leftTestimonial.name.split(" ").map(w => w[0]).join("")}
                              </div>
                              <div>
                                <h4 className="text-sm sm:text-[15px] font-bold text-[#4c3527] font-serif-elegant leading-none flex items-center gap-1.5 flex-wrap">
                                  {leftTestimonial.name}
                                  <span className="inline-block bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black border border-rose-100/60 font-sans tracking-wide">
                                    C-{leftTestimonial.cohort}
                                  </span>
                                </h4>
                                <p className="text-[10px] sm:text-xs text-[#a08575] mt-1 font-medium">
                                  {leftTestimonial.role}
                                </p>
                              </div>
                            </div>

                            {/* Relocated Cute Vintage Postage Sticker Stamp Seal to prevent text overlap */}
                            {(() => {
                              const sticker = getCuteStickers(leftTestimonial.tag);
                              return (
                                <div className={`border-2 border-dashed rounded-lg p-0.5 px-2 rotate-[4deg] transition hover:rotate-3 cursor-default flex items-center space-x-1 shadow-xs text-[10px] font-bold ${sticker.color}`}>
                                  <span>{sticker.emoji}</span>
                                  <span className="uppercase font-mono text-[8px] tracking-tight">{sticker.text}</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Card Content Text - 100% visible, no overlapping sticker */}
                          <div className="flex-grow my-4 flex items-center justify-center px-1">
                            <div className="relative p-4 sm:p-5 rounded-2xl bg-white border border-rose-100/60 shadow-inner w-full max-h-[220px] overflow-y-auto custom-scrollbar">
                              {/* Aesthetic golden flower quote icon */}
                              <div className="absolute top-2 left-2 text-rose-200 block text-3xl font-serif leading-none select-none pointer-events-none">“</div>

                              <p className="text-sm sm:text-base text-[#543b2a] leading-relaxed italic relative z-10 px-2 font-serif-elegant">
                                {leftTestimonial.text}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer React & Nav */}
                          <div className="flex items-center justify-between pt-2 border-t border-rose-100/60 text-[10px] text-[#a08575]">
                            <button
                              onClick={() => toggleTributeLike(leftTestimonial.id)}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${likedIds.includes(leftTestimonial.id)
                                  ? "bg-rose-500 text-white border-rose-400 shadow-sm font-bold"
                                  : "bg-white text-rose-500 border-rose-100 hover:bg-rose-50"
                                }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${likedIds.includes(leftTestimonial.id) ? "fill-white" : ""}`} />
                              <span>{likedIds.includes(leftTestimonial.id) ? "Loved!" : "React Heart"}</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                              <span className="font-bold">Original Trainee Note</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <Heart className="w-12 h-12 text-rose-100 mb-2 animate-pulse" />
                          <p className="text-xs text-amber-800/50 italic">End of testimonials roster on this side of book.</p>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 text-[8px] text-[#a08575]">
                        Page {((currentSpread - 2) * 2) + 4}
                      </div>
                    </div>

                    {/* Right Page (Testimonial Card B) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-5 sm:p-7 relative bg-[#fffdfb]"
                    >

                      {rightTestimonial ? (
                        <div className="h-full flex flex-col justify-between">
                          {/* Card Header Top */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm shadow-sm ${rightTestimonial.avatarColor}`}>
                                {rightTestimonial.name.split(" ").map(w => w[0]).join("")}
                              </div>
                              <div>
                                <h4 className="text-sm sm:text-[15px] font-bold text-[#4c3527] font-serif-elegant leading-none flex items-center gap-1.5 flex-wrap">
                                  {rightTestimonial.name}
                                  <span className="inline-block bg-amber-50 text-amber-850 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black border border-amber-100/60 font-sans tracking-wide">
                                    C-{rightTestimonial.cohort}
                                  </span>
                                </h4>
                                <p className="text-[10px] sm:text-xs text-[#a08575] mt-1 font-medium">
                                  {rightTestimonial.role}
                                </p>
                              </div>
                            </div>

                            {/* Relocated Cute Vintage Postage Sticker Stamp Seal to prevent text overlap */}
                            {(() => {
                              const sticker = getCuteStickers(rightTestimonial.tag);
                              return (
                                <div className={`border-2 border-dashed rounded-lg p-0.5 px-2 rotate-[-3deg] transition hover:rotate-3 cursor-default flex items-center space-x-1 shadow-xs text-[10px] font-bold ${sticker.color}`}>
                                  <span>{sticker.emoji}</span>
                                  <span className="uppercase font-mono text-[8px] tracking-tight">{sticker.text}</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Card Content Text - 100% visible, no overlapping sticker */}
                          <div className="flex-grow my-4 flex items-center justify-center px-1">
                            <div className="relative p-4 sm:p-5 rounded-2xl bg-[#fdfaf7] border border-amber-100 shadow-inner w-full max-h-[220px] overflow-y-auto custom-scrollbar">
                              {/* Aesthetic golden flower quote icon */}
                              <div className="absolute top-2 left-2 text-rose-200 block text-3xl font-serif leading-none select-none pointer-events-none">“</div>

                              <p className="text-sm sm:text-base text-[#543b2a] leading-relaxed italic relative z-10 px-2 font-serif-elegant">
                                {rightTestimonial.text}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer React & Nav */}
                          <div className="flex items-center justify-between pt-2 border-t border-amber-100/60 text-[10px] text-[#a08575]">
                            <button
                              onClick={() => toggleTributeLike(rightTestimonial.id)}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${likedIds.includes(rightTestimonial.id)
                                  ? "bg-rose-500 text-white border-rose-400 shadow-sm font-bold"
                                  : "bg-white text-rose-500 border-rose-100 hover:bg-rose-50"
                                }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${likedIds.includes(rightTestimonial.id) ? "fill-white" : ""}`} />
                              <span>{likedIds.includes(rightTestimonial.id) ? "Loved!" : "React Heart"}</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                              <span className="font-bold font-serif-elegant">Trainee Note</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <Heart className="w-12 h-12 text-rose-100 mb-2 animate-pulse" />
                          <p className="text-xs text-amber-800/50 italic">End of testimonials roster. Swipe or jump to filter.</p>
                          <button
                            onClick={() => setCurrentSpread(1)}
                            className="mt-3.5 text-[10px] px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-full"
                          >
                            Search All
                          </button>
                        </div>
                      )}

                      {/* Spread Turner Actions */}
                      <div className="absolute -bottom-1 right-2 flex items-center space-x-1.5 z-40 bg-white/80 p-1.5 rounded-t-lg shadow-sm border border-b-0 border-[#dfc3a7]">
                        <button
                          onClick={prevPageSpread}
                          className="p-1 px-1.5 bg-rose-50 rounded text-rose-700 hover:bg-rose-100 transition text-[10px] font-bold"
                          title="Back Page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] font-bold text-amber-900">
                          Sp. {currentSpread}
                        </span>
                        <button
                          onClick={nextPageSpread}
                          className="p-1 px-1.5 bg-rose-50 rounded text-rose-700 hover:bg-rose-100 transition text-[10px] font-bold"
                          title="Next Page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-2 right-4 text-[8px] text-[#a08575]">
                        Page {((currentSpread - 2) * 2) + 5}
                      </div>
                    </div>

                  </div>
                )}


                {/* - - - - - - SPREAD LAST: CREATE NEW TESTIMONY + BACK COVERS - - - - - - */}
                {currentSpread === bookSpreadsCount - 1 && (
                  <div className="w-full h-full flex flex-col md:flex-row z-30" style={{ transformStyle: "preserve-3d", perspective: 2000 }}>

                    {/* Left Page (Submit a Custom Feedback card form) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-4 sm:p-6 border-r border-[#f1e6da] relative bg-[#faf6f1]"
                    >

                      <div>
                        <div className="border-b border-rose-100 pb-2">
                          <h4 className="text-sm font-bold font-serif-elegant tracking-tight text-[#543b2a] flex items-center gap-1">
                            <Plus className="w-4 h-4 text-rose-500" /> Write Your Appreciation Note
                          </h4>
                          <p className="text-[9px] text-amber-800/60 mt-0.5">Let’s add more heartfelt praises into Yuvasree’s memories box!</p>
                        </div>

                        {formSuccess ? (
                          <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 text-center my-6 space-y-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                              <Check className="w-5 h-5" />
                            </div>
                            <h5 className="text-xs font-bold text-emerald-950">Message Appended Successfully!</h5>
                            <p className="text-[10px] text-emerald-800">Your love card has been integrated into the 97-trainee memories book. Swapping pages back now...</p>
                          </div>
                        ) : (
                          <form onSubmit={saveNewTestimonialForm} className="space-y-2 mt-2.5">

                            {/* Trainee Details Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[9px] font-bold uppercase text-amber-900 block mb-0.5">Your Name</label>
                                <input
                                  type="text"
                                  required
                                  value={newNoteName}
                                  onChange={(e) => setNewNoteName(e.target.value)}
                                  placeholder="e.g. Ramesh"
                                  className="w-full p-1.5 rounded-lg border border-amber-200 text-xs focus:ring-1 focus:ring-rose-300 focus:outline-none bg-white font-medium"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase text-amber-900 block mb-0.5">Your Title</label>
                                <input
                                  type="text"
                                  required
                                  value={newNoteRole}
                                  onChange={(e) => setNewNoteRole(e.target.value)}
                                  placeholder="e.g. Programmer Analyst Trainee"
                                  className="w-full p-1.5 rounded-lg border border-amber-200 text-xs focus:ring-1 focus:ring-rose-300 focus:outline-none bg-white font-medium"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase text-amber-900 block mb-0.5">Your Cohort</label>
                                <select
                                  value={newNoteCohort}
                                  onChange={(e) => setNewNoteCohort(e.target.value)}
                                  className="w-full p-1.5 rounded-lg border border-amber-200 text-xs focus:ring-1 focus:ring-rose-300 focus:outline-none bg-white font-medium"
                                >
                                  <option value="004">Cohort 004</option>
                                  <option value="005">Cohort 005</option>
                                  <option value="006">Cohort 006</option>
                                </select>
                              </div>
                            </div>

                            {/* Tag theme representation selector */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold uppercase text-amber-900 block mb-0.5">Primary Praise Tag</label>
                                <select
                                  value={newNoteTag}
                                  onChange={(e) => setNewNoteTag(e.target.value)}
                                  className="w-full p-1.5 rounded-lg border border-amber-200 text-xs focus:ring-1 focus:ring-rose-300 focus:outline-none bg-white font-medium"
                                >
                                  <option value="Pillar of Strength">Pillar of Strength</option>
                                  <option value="Patience Champion">Patience Champion</option>
                                  <option value="Smiling Guide">Smiling Guide</option>
                                  <option value="Superstar Trainer">Superstar Trainer</option>
                                  <option value="Problem Solver">Problem Solver</option>
                                  <option value="Dedicated Guide">Dedicated Guide</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase text-amber-900 block mb-0.5">Appreciation Card Theme</label>
                                <div className="flex space-x-1.5 items-center mt-1">
                                  {["rose", "gold", "teal", "parchment"].map((theme, idx) => (
                                    <button
                                      type="button"
                                      key={idx}
                                      onClick={() => setCardTheme(theme as any)}
                                      className={`w-4 h-4 rounded-full border transform active:scale-95 transition-all ${theme === "rose" ? "bg-rose-200 border-rose-400" :
                                          theme === "gold" ? "bg-amber-200 border-amber-400" :
                                            theme === "teal" ? "bg-teal-200 border-teal-400" : "bg-[#f4ebe1] border-amber-300"
                                        } ${cardTheme === theme ? "ring-2 ring-rose-500 scale-110" : "opacity-80"}`}
                                      title={`${theme} Card`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Raw msg text block */}
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[9px] font-bold uppercase text-amber-900">Your Personal Dedication Message</label>
                                <button
                                  type="button"
                                  onClick={triggerLocalAIEnhance}
                                  className="text-[9px] text-rose-700 font-bold hover:underline flex items-center gap-0.5"
                                  title="Write using elegant appreciation templates"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> Auto-Enhance Message
                                </button>
                              </div>
                              <textarea
                                rows={3}
                                required
                                value={newNoteRawMsg}
                                onChange={(e) => setNewNoteRawMsg(e.target.value)}
                                placeholder="Write how Yuvasree Mam helped you, taught you, or supported the 97 trainees with patience..."
                                className="w-full p-2 rounded-lg border border-amber-200 text-xs focus:ring-2 focus:ring-rose-300 focus:outline-none bg-white font-medium placeholder-amber-900/40"
                              />
                            </div>

                            {/* Submit Actions */}
                            <button
                              type="submit"
                              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-transform active:scale-95 shadow-md tracking-wider uppercase"
                            >
                              Append Love Card to Book 🌸
                            </button>

                          </form>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-rose-100/60 pt-3 text-[10px] text-[#a08575] mt-1">
                        <button
                          onClick={() => setCurrentSpread(1)}
                          className="font-bold text-rose-600 hover:underline inline"
                        >
                          Back to Directory
                        </button>
                        <span>Page {bookSpreadsCount * 2 - 1} of {bookSpreadsCount * 2}</span>
                      </div>

                    </div>

                    {/* Right Page (The Elegant BACK COVER) */}
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 relative bg-gradient-to-tr from-[#543b2a] to-[#26160a] text-amber-100 rounded-r-lg shadow-inner text-center"
                    >

                      {/* Filigree corner borders back cover styling */}
                      <div className="absolute inset-4 sm:inset-6 border-2 border-amber-200/20 rounded-lg pointer-events-none" />

                      <div className="mt-8">
                        <span className="text-sm font-bold uppercase tracking-widest text-[#dfb76c] block mb-2 font-serif-elegant">Gratitude Endnotes</span>
                        <p className="text-xs text-amber-200 italic font-parisienne text-2xl mt-4">"Hands that teach shape the future."</p>
                        <div className="w-12 h-px bg-amber-400/40 mx-auto my-6" />
                      </div>

                      {/* Appreciation Stamp seal */}
                      <div className="px-4">
                        <p className="text-[11px] text-amber-300 max-w-xs mx-auto leading-relaxed">
                          Yuvasree Mam, and all 97 people in this batch wish you endless success, health, and smiling memories. May your passion as a coach continue to light up many more paths!
                        </p>
                        <span className="text-xl font-cursive text-[#dfb76c] block mt-4 select-none">
                          With Endless Respect & Admiration
                        </span>
                        <span className="text-[10px] font-bold tracking-wider text-rose-300 block mt-1 uppercase">
                          — Your 97 Trainees batch of 2026 —
                        </span>
                      </div>

                      <div className="mb-6 space-y-2 relative z-10">
                        <button
                          onClick={() => setCurrentSpread(0)}
                          className="px-5 py-2 border border-amber-300/40 hover:bg-white/5 text-amber-200 text-xs rounded-full font-bold shadow-sm"
                        >
                          Return to Front Cover
                        </button>
                        <p className="text-[9px] text-amber-400">Memory Book Compilation Completed Successfully</p>
                      </div>

                    </div>

                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </main>

      {/* FOOTER BAR WITH NAVIGATION SHORTCUTS */}
      <footer id="app-footer-bar" className="relative z-20 px-6 py-3 border-t border-rose-100 bg-white/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs text-[#a08575] font-medium">
        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
          <span className="text-[#805e46] font-bold">Quick Section Jump:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCurrentSpread(0)}
              className={`p-1 px-2.5 rounded-full border transition-all ${currentSpread === 0 ? "bg-rose-500 text-white border-rose-400" : "bg-white text-[#2d231e] hover:bg-rose-50 border-rose-100"
                }`}
            >
              Cover
            </button>
            <button
              onClick={() => setCurrentSpread(1)}
              className={`p-1 px-2.5 rounded-full border transition-all ${currentSpread === 1 ? "bg-rose-500 text-white border-rose-400" : "bg-white text-[#2d231e] hover:bg-rose-50 border-rose-100"
                }`}
            >
              Stats & Trainee Directory
            </button>
            <button
              onClick={() => setCurrentSpread(2)}
              className={`p-1 px-2.5 rounded-full border transition-all ${currentSpread >= 2 && currentSpread < bookSpreadsCount - 1 ? "bg-rose-500 text-white border-rose-400" : "bg-white text-[#2d231e] hover:bg-rose-50 border-rose-100"
                }`}
            >
              Expressed Feedbacks
            </button>
            <button
              onClick={() => setCurrentSpread(bookSpreadsCount - 1)}
              className={`p-1 px-2.5 rounded-full border transition-all ${currentSpread === bookSpreadsCount - 1 ? "bg-rose-500 text-white border-rose-400" : "bg-white text-[#2d231e] hover:bg-rose-50 border-rose-100"
                }`}
            >
              Write Note
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 text-[11px] text-[#805e46] font-semibold gap-2">
          <span className="flex items-center gap-1 bg-rose-50/60 px-3 py-1 rounded-full border border-rose-100 text-[10px]">
            Made by <strong className="text-rose-600 font-bold">Aravindh</strong> with love and memories of this past 3 months ❤️
          </span>
          <span>Spread {currentSpread + 1} / {bookSpreadsCount}</span>
        </div>
      </footer>


      {/* - - - - - - INTRO POPUP: HANDWRITING TYPING GREETINGS GALA - - - - - - */}
      {showIntro && (
        <div id="intro-writing-popup" className="absolute inset-0 bg-rose-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">

          <div className="w-full max-w-3xl bg-[#fdfbf6] rounded-2xl shadow-2xl relative p-6 sm:p-10 border border-[#dfc3a7] overflow-y-auto max-h-[90vh] custom-scrollbar overflow-x-hidden animate-soft-float">

            {/* Elegant Vintage Frame overlay */}
            <div className="absolute inset-4 sm:inset-6 border border-amber-200 pointer-events-none rounded opacity-45" />
            <div className="absolute inset-5 sm:inset-7 border-2 border-dashed border-amber-300 rounded pointer-events-none opacity-20" />

            <div className="flex justify-between items-start border-b border-rose-100 pb-3">
              <span className="text-xs uppercase tracking-widest gold-text font-serif-elegant font-bold">Welcoming Greetings Gala</span>
              <button
                onClick={() => {
                  setShowIntro(false);
                  // Ensure BGM plays when closing the greeting page
                  if (synthRef.current) {
                    synthRef.current.toggle(true).then((playing) => {
                      if (playing) setBackgroundPlay(true);
                    });
                  }
                }}
                className="p-1 rounded-full hover:bg-rose-50 text-rose-700 font-bold transition-all relative z-10"
                title="Skip to Book Overview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A crazy, beautiful multilingual greetings gallery */}
            <div className="mt-6 mb-4">
              <h3 className="text-center text-xs font-serif-elegant font-bold gold-text uppercase tracking-widest mb-3">
                Saying Hi in many lovely languages! 🌟
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-2xl mx-auto px-2">
                {multilingualGreetings.map((g, i) => (
                  <div 
                    key={i} 
                    className={`px-3 py-1.5 rounded-xl border text-center transition-all hover:scale-105 shadow-xs flex flex-col justify-center items-center ${g.color}`}
                  >
                    <span className="text-[8px] uppercase tracking-tighter opacity-60 font-semibold">{g.lang}</span>
                    <span className="text-xs font-bold leading-tight mt-0.5">{g.text}</span>
                    <span className="text-[9px] italic opacity-85">"{g.translit}"</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Handwritten script reveal panel mimicking pen quill cursor */}
            <div className="my-6 min-h-[200px] px-2 sm:px-4 relative flex flex-col justify-center border-t border-rose-100/60 pt-6">

              <div className="space-y-4 text-center max-w-xl mx-auto">
                <span className="text-3xl font-parisienne block text-rose-600 mb-1">Message to you, Yuvasree</span>

                {/* Yuvasree's Beautiful Portrait in Intro */}
                <div className="flex justify-center my-2 relative z-10">
                  <YuvasreePhoto size="medium" />
                </div>

                {/* Simulated typewriter cursor representation tracing inline */}
                <p className="font-handwritten text-lg sm:text-xl text-amber-950 leading-relaxed font-semibold filter drop-shadow-[0_1px_1px_rgba(139,92,26,0.15)] px-4">
                  {currentIntroLine}
                  <span className="typing-cursor ml-1" />
                </p>

                {introCompleted && (
                  <div className="pt-1 animate-bounce">
                    <p className="text-[9px] text-amber-700 uppercase font-black tracking-widest">
                      ✦ Words Written Successfully ✦
                    </p>
                  </div>
                )}
              </div>

              {/* Float Floating Feather Pen / Icon Cursor following line drawing */}
              <div className="absolute right-12 bottom-6 animate-pulse text-amber-600/50 hidden md:block">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-12">
                  <path d="M2 22s8.25-3 12.5-7.5S22 2 22 2s-6.75 3-11.25 7.25S2 22 2 22z" />
                  <path d="M12 10l3 3" />
                  <path d="M14 7l3 3" />
                </svg>
              </div>
            </div>

            {/* Pop-up Navigation Button Trigger */}
            <div className="border-t border-rose-100/60 pt-4 text-center space-y-2">
              <button
                onClick={() => {
                  setShowIntro(false);
                  // Ensure BGM starts playing seamlessly exactly as they enter the cover page
                  if (synthRef.current) {
                    synthRef.current.toggle(true).then((playing) => {
                      if (playing) setBackgroundPlay(true);
                    });
                  }
                }}
                className="px-8 py-3 gold-gradient hover:opacity-95 text-[#3b2401] rounded-full text-xs font-bold shadow-lg tracking-widest uppercase transition-transform hover:scale-105 active:scale-95 flex items-center space-x-2 mx-auto relative z-10"
              >
                <span>Enter Yuvasree's Memory Book 🌸</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[9px] text-amber-800">
                Clicking will open the memories book and start playing the beautiful background score.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

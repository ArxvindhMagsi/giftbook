import { useState } from "react";
import { Sparkles, Heart } from "lucide-react";
import yuvaWebp from "@/Yuva.webp";

interface YuvasreePhotoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function YuvasreePhoto({ className = "", size = "medium" }: YuvasreePhotoProps) {
  // Try loading from different possible filenames/paths in case of different user upload extensions
  const sources = [
    yuvaWebp,
    "/yuvasree.jpg",
    "/yuvasree.png",
    "/yuvasree.jpeg",
    "/yuvasree_photo.jpg",
    "/yuvasree_photo.png",
    "yuvasree.jpg",
    "yuvasree.png"
  ];

  const [srcIndex, setSrcIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const handleImageError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const activeSrc = sources[srcIndex];

  // Visual classes depending on size
  const sizeClasses = {
    small: "w-16 h-16 border-2",
    medium: "w-28 h-28 sm:w-32 sm:h-32 border-4",
    large: "w-40 h-40 sm:w-48 sm:h-48 border-4"
  };

  if (hasFailedAll) {
    // Exquisitely beautiful signature vector illustration matching the book theme as fallback
    return (
      <div 
        id="yuvasree-placeholder-avatar"
        className={`relative rounded-full bg-gradient-to-br from-rose-100 to-amber-100 border-[#dfb76c] flex flex-col items-center justify-center text-center shadow-md select-none overflow-hidden group ${sizeClasses[size]} ${className}`}
      >
        {/* Golden glow back drop */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-xs transition group-hover:scale-110 duration-500" />
        
        {/* Cute flowers & sparkles decorations */}
        <div className="absolute top-1 left-1 animate-pulse text-amber-500 opacity-60">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="absolute bottom-1 right-2 text-rose-400 opacity-60">
          <Heart className="w-3 h-3 fill-rose-300" />
        </div>

        {/* Big initial letter with gorgeous handwriting styling */}
        <span className="relative z-10 text-rose-600 font-parisienne font-bold text-4xl sm:text-5xl mt-1 tracking-tight">
          Y
        </span>
        <span className="relative z-10 text-[9px] sm:text-[10px] text-amber-900 font-black tracking-widest uppercase mt-0.5">
          Yuvasree
        </span>

        {/* Elegant bindi dot decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-5 w-1.5 h-1.5 rounded-full bg-rose-600 shadow-[0_0_3px_#f43f5e]" />
      </div>
    );
  }

  // Render the real photo. All images have referrerPolicy="no-referrer" as requested.
  return (
    <div className={`relative rounded-full overflow-hidden shadow-lg border-[#dfb76c] p-0.5 bg-white transition-transform duration-500 hover:scale-105 ${sizeClasses[size]} ${className}`}>
      <img
        src={activeSrc}
        alt="Yuvasree"
        onError={handleImageError}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover rounded-full"
      />
      {/* Mini bindi/sparkle decoration overlying image */}
      <div className="absolute top-1 right-1 bg-yellow-400/90 text-[8px] px-1.5 py-0.5 rounded-full text-amber-950 font-bold border border-yellow-200 animate-bounce shadow-xs">
        Mam 🌸
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { loadVoicePrefs, getVoices, speakableText } from "@/lib/voice";

export function SpeakButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "speaking" | "paused">("idle");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const start = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const clean = speakableText(text);
    if (!clean) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    const prefs = loadVoicePrefs();
    const voice = getVoices().find((v) => v.voiceURI === prefs.voiceURI);
    if (voice) utter.voice = voice;
    utter.rate = prefs.rate;
    utter.pitch = prefs.pitch;
    utter.onend = () => setState("idle");
    utter.onerror = () => setState("idle");
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setState("speaking");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };
  const resume = () => {
    window.speechSynthesis.resume();
    setState("speaking");
  };
  const stop = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {state === "speaking" ? (
        <button
          type="button"
          onClick={pause}
          disabled={disabled}
          className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
        >
          <Pause className="h-3.5 w-3.5" /> Pause
        </button>
      ) : state === "paused" ? (
        <button
          type="button"
          onClick={resume}
          className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
        >
          <Play className="h-3.5 w-3.5" /> Resume
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="ripple inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" /> Play
        </button>
      )}
      {state !== "idle" && (
        <button
          type="button"
          onClick={stop}
          className="ripple inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          aria-label="Stop"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

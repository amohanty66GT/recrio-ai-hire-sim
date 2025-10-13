import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const VOICE_MAP: Record<string, string> = {
  "Sarah Chen": "nova",
  "Marcus Thompson": "onyx",
  "Alex Rivera": "alloy",
  "Jordan Kim": "echo",
  "System": "shimmer",
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Array<{ text: string; author: string }>>([]);
  const isPlayingRef = useRef(false);

  const speak = useCallback(async (text: string, author: string) => {
    // Add to queue
    queueRef.current.push({ text, author });
    
    // If already playing, don't start another
    if (isPlayingRef.current) return;
    
    processQueue();
  }, []);

  const processQueue = async () => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setCurrentSpeaker(null);
      return;
    }

    isPlayingRef.current = true;
    const { text, author } = queueRef.current.shift()!;
    
    try {
      setIsSpeaking(true);
      setCurrentSpeaker(author);

      const voice = VOICE_MAP[author] || "alloy";
      
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, voice },
      });

      if (error) throw error;

      // Create audio element and play
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;

      audio.onended = () => {
        processQueue();
      };

      audio.onerror = () => {
        console.error("Audio playback error");
        processQueue();
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      processQueue();
    }
  };

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    queueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setCurrentSpeaker(null);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    currentSpeaker,
  };
};

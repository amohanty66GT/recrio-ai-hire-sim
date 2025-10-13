import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceParticipantsProps {
  speakers: Array<{ name: string; isSpeaking: boolean }>;
}

export const VoiceParticipants = ({ speakers }: VoiceParticipantsProps) => {
  return (
    <div className="bg-background border-b border-border px-6 py-3">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Active Participants:</span>
        <div className="flex gap-2">
          {speakers.map((speaker) => (
            <div
              key={speaker.name}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                speaker.isSpeaking
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {speaker.isSpeaking ? (
                <Mic className="w-4 h-4 animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{speaker.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

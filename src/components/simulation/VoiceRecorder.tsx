import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  onRecordingStart?: () => void;
}

export const VoiceRecorder = ({ onTranscript, disabled, onRecordingStart }: VoiceRecorderProps) => {
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceRecorder();

  const handleToggleRecording = async () => {
    if (isRecording) {
      const transcript = await stopRecording();
      if (transcript) {
        onTranscript(transcript);
      }
    } else {
      onRecordingStart?.();
      await startRecording();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleToggleRecording}
        disabled={disabled || isTranscribing}
        size="icon"
        variant={isRecording ? "destructive" : "secondary"}
        className="h-[80px] w-12"
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
      {isRecording && (
        <span className="text-sm text-destructive animate-pulse">Recording...</span>
      )}
      {isTranscribing && (
        <span className="text-sm text-muted-foreground">Transcribing...</span>
      )}
    </div>
  );
};

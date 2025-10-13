import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";

interface ResponseInputProps {
  onSubmit: (response: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onRecordingStart?: () => void;
}

export const ResponseInput = ({
  onSubmit,
  placeholder = "Type your response...",
  disabled = false,
  onRecordingStart,
}: ResponseInputProps) => {
  const [response, setResponse] = useState("");

  const handleVoiceTranscript = (text: string) => {
    setResponse(text);
  };

  const handleSubmit = () => {
    if (response.trim()) {
      onSubmit(response);
      setResponse("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background px-6 py-4">
      <div className="flex gap-2">
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[80px] resize-none"
        />
        <VoiceRecorder
          onTranscript={handleVoiceTranscript}
          disabled={disabled}
          onRecordingStart={onRecordingStart}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || !response.trim()}
          size="icon"
          className="flex-shrink-0 h-[80px] w-12"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line, or use voice recording
      </p>
    </div>
  );
};

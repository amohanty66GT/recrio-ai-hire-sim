import { cn } from "@/lib/utils";
import { StimulusDisplay } from "./StimulusDisplay";

export type MessageRole = "system" | "agent" | "candidate";

interface ChatMessageProps {
  role: MessageRole;
  author?: string;
  content: string;
  timestamp?: string;
  stimulus?: {
    type: "code" | "document" | "data";
    title: string;
    content: string;
  };
}

export const ChatMessage = ({ role, author, content, timestamp, stimulus }: ChatMessageProps) => {
  const getRoleColor = () => {
    switch (role) {
      case "system":
        return "text-message-system";
      case "agent":
        return "text-message-agent";
      case "candidate":
        return "text-message-candidate";
      default:
        return "text-foreground";
    }
  };

  const getRoleLabel = () => {
    if (author) return author;
    switch (role) {
      case "system":
        return "System";
      case "agent":
        return "AI Agent";
      case "candidate":
        return "You";
      default:
        return "";
    }
  };

  return (
    <div className="py-3 px-6 hover:bg-muted/30 transition-colors group">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded bg-secondary/50 flex items-center justify-center text-xs font-semibold text-secondary-foreground">
          {getRoleLabel().slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className={cn("font-semibold text-sm", getRoleColor())}>
              {getRoleLabel()}
            </span>
            {timestamp && (
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            )}
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
          {stimulus && (
            <StimulusDisplay
              type={stimulus.type}
              title={stimulus.title}
              content={stimulus.content}
            />
          )}
        </div>
      </div>
    </div>
  );
};

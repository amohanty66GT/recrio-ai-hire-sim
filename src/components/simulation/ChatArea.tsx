import { useEffect, useRef } from "react";
import { ChatMessage, MessageRole } from "./ChatMessage";
import { ResponseInput } from "./ResponseInput";
import { Button } from "@/components/ui/button";

export interface Message {
  id: string;
  role: MessageRole;
  author?: string;
  content: string;
  timestamp?: string;
}

interface ChatAreaProps {
  channelName: string;
  messages: Message[];
  onSendResponse: (response: string) => void;
  onSubmitSimulation: () => void;
  violations: number;
}

export const ChatArea = ({
  channelName,
  messages,
  onSendResponse,
  onSubmitSimulation,
  violations,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Channel Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-muted-foreground">#</span>
            {channelName}
          </h2>
          {violations > 0 && (
            <p className="text-xs text-destructive mt-1">
              Violations detected: {violations}
            </p>
          )}
        </div>
        <Button onClick={onSubmitSimulation} size="lg">
          Submit Simulation
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-recrio-chat">
        <div className="max-w-5xl mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              author={message.author}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Response Input */}
      <ResponseInput onSubmit={onSendResponse} />
    </div>
  );
};

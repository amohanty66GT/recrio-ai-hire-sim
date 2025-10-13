import { useState, useEffect } from "react";
import { Sidebar } from "@/components/simulation/Sidebar";
import { ChatArea, Message } from "@/components/simulation/ChatArea";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockChannels = [
  { id: "technical", name: "technical", unread: 21 },
  { id: "cross-functional", name: "cross-functional", unread: 0 },
  { id: "exec-debrief", name: "exec-debrief", locked: true },
];

const mockMessages: Message[] = [
  {
    id: "1",
    role: "system",
    content:
      "As a Software Engineer Intern, you need to enhance the reliability of transactions and improve dashboard performance.",
    timestamp: "9:00 AM",
  },
  {
    id: "2",
    role: "agent",
    author: "Ari (Founder/PM)",
    content: "We need to ensure our transaction system is rock solid.",
    timestamp: "9:01 AM",
  },
  {
    id: "3",
    role: "agent",
    author: "Baa (Lead Engineer)",
    content: "Remember, we have strict uptime requirements and data compliance.",
    timestamp: "9:02 AM",
  },
  {
    id: "4",
    role: "agent",
    author: "Baa (Lead Engineer)",
    content: "How would you approach optimizing SQL queries for transaction reliability?",
    timestamp: "9:02 AM",
  },
  {
    id: "5",
    role: "candidate",
    content:
      "I would start by analyzing query execution plans and adding appropriate indexes...",
    timestamp: "9:05 AM",
  },
  {
    id: "6",
    role: "agent",
    author: "Founder",
    content: "What specific metrics would you track?",
    timestamp: "9:06 AM",
  },
];

const Index = () => {
  const [activeChannel, setActiveChannel] = useState("technical");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [violations, setViolations] = useState(2);
  const [timeRemaining, setTimeRemaining] = useState("5:11");
  const { toast } = useToast();

  // Simulate timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const [minutes, seconds] = prev.split(":").map(Number);
        const totalSeconds = minutes * 60 + seconds - 1;
        
        if (totalSeconds <= 0) {
          clearInterval(timer);
          return "0:00";
        }
        
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        return `${newMinutes}:${newSeconds.toString().padStart(2, "0")}`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSendResponse = (response: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "candidate",
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMessage]);
    
    toast({
      title: "Response recorded",
      description: "Your answer has been submitted for evaluation.",
    });
  };

  const handleSubmitSimulation = () => {
    toast({
      title: "Simulation submitted",
      description: "Your responses are being analyzed. Results will be available shortly.",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        channels={mockChannels}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        timeRemaining={timeRemaining}
        violations={violations}
        onViolation={() => {}}
        simulationId="demo"
      />
      <ChatArea
        channelName={activeChannel}
        messages={messages}
        onSendResponse={handleSendResponse}
        onSubmitSimulation={handleSubmitSimulation}
        violations={violations}
      />
    </div>
  );
};

export default Index;

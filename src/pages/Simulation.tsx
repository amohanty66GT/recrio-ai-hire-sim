import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/simulation/Sidebar";
import { ChatArea, Message } from "@/components/simulation/ChatArea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  unread?: number;
  locked?: boolean;
}

interface Question {
  id: string;
  channel: string;
  mainQuestion: string;
  context: Array<{ agent: string; message: string }>;
  followUps: Array<{ id: string; agent: string; question: string }>;
}

const Simulation = () => {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [violations, setViolations] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("15:00");
  const [scenario, setScenario] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [followUpIndex, setFollowUpIndex] = useState(0);

  useEffect(() => {
    if (simulationId) {
      loadSimulation();
    }
  }, [simulationId]);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const [minutes, seconds] = prev.split(":").map(Number);
        const totalSeconds = minutes * 60 + seconds - 1;
        
        if (totalSeconds <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return "0:00";
        }
        
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        return `${newMinutes}:${newSeconds.toString().padStart(2, "0")}`;
      });
    }, 1000);

    // Proctoring - detect tab switches
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tab_switch");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadSimulation = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single();

      if (error) throw error;

      const generatedScenario = data.generated_scenario as any;
      setScenario(generatedScenario);

      // Setup channels
      const channelData = (generatedScenario.channels || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        unread: 0,
      }));
      setChannels(channelData);
      
      if (channelData.length > 0 && generatedScenario.questions) {
        setActiveChannel(channelData[0].id);
        loadQuestion(generatedScenario.questions[0]);
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
      toast({
        title: "Error",
        description: "Failed to load simulation",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestion = (question: Question) => {
    const questionMessages: Message[] = [];
    
    // Add context messages from team members
    question.context.forEach((ctx, idx) => {
      questionMessages.push({
        id: `context-${idx}`,
        role: "agent",
        author: ctx.agent,
        content: ctx.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // Add the main question
    questionMessages.push({
      id: question.id,
      role: "agent",
      author: question.context[0]?.agent || "Team",
      content: question.mainQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setMessages(questionMessages);
  };

  const handleViolation = async (type: string) => {
    setViolations((prev) => prev + 1);
    
    try {
      await supabase.from('simulation_violations').insert({
        simulation_id: simulationId,
        violation_type: type,
      });
    } catch (error) {
      console.error('Error logging violation:', error);
    }

    toast({
      title: "Violation detected",
      description: type === "tab_switch" ? "Tab switching detected" : "Proctoring violation",
      variant: "destructive",
    });
  };

  const handleSendResponse = async (response: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "candidate",
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);

    // Save response to database
    const currentQuestion = scenario.questions[currentQuestionIndex];
    const questionId = followUpIndex === 0 
      ? currentQuestion.id 
      : currentQuestion.followUps[followUpIndex - 1].id;

    try {
      await supabase.from('simulation_responses').insert({
        simulation_id: simulationId,
        question_id: questionId,
        response,
      });

      // Move to next follow-up or question
      if (followUpIndex < currentQuestion.followUps.length) {
        const followUp = currentQuestion.followUps[followUpIndex];
        setTimeout(() => {
          const followUpMessage: Message = {
            id: followUp.id,
            role: "agent",
            author: followUp.agent,
            content: followUp.question,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, followUpMessage]);
          setFollowUpIndex(followUpIndex + 1);
        }, 1000);
      } else if (currentQuestionIndex < scenario.questions.length - 1) {
        // Move to next question
        setTimeout(() => {
          const nextQuestion = scenario.questions[currentQuestionIndex + 1];
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setFollowUpIndex(0);
          setActiveChannel(nextQuestion.channel);
          loadQuestion(nextQuestion);
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    }
  };

  const handleSubmitSimulation = async () => {
    try {
      await supabase
        .from('simulations')
        .update({ status: 'submitted', completed_at: new Date().toISOString() })
        .eq('id', simulationId);

      toast({
        title: "Simulation submitted",
        description: "Your responses are being analyzed.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting simulation:', error);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmitSimulation();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        channels={channels}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        timeRemaining={timeRemaining}
        violations={violations}
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

export default Simulation;

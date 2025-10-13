import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/simulation/Sidebar";
import { ChatArea, Message } from "@/components/simulation/ChatArea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  interstitialDialogue?: Array<{ agent: string; message: string; delayAfterResponse?: number }>;
  followUps: Array<{ id: string; agent: string; question: string }>;
  stimulus?: {
    type: "code" | "document" | "data";
    title: string;
    content: string;
  };
}

const Simulation = () => {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState("");
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({});
  const [violations, setViolations] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("30:00");
  const [scenario, setScenario] = useState<any>(null);
  const [channelProgress, setChannelProgress] = useState<Record<string, { questionIndex: number; followUpIndex: number; completed: boolean }>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (simulationId && user) {
      loadSimulation();
    }
  }, [simulationId, user]);

  useEffect(() => {
    // Load questions for active channel if not loaded yet
    if (activeChannel && scenario && (!channelMessages[activeChannel] || channelMessages[activeChannel].length === 0)) {
      loadChannelQuestions(activeChannel, scenario.questions);
    }
  }, [activeChannel, scenario]);

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
      
      // Initialize channel progress and messages
      const initialProgress: Record<string, { questionIndex: number; followUpIndex: number; completed: boolean }> = {};
      const initialMessages: Record<string, Message[]> = {};
      
      channelData.forEach((ch: any) => {
        initialProgress[ch.id] = { questionIndex: 0, followUpIndex: 0, completed: false };
        initialMessages[ch.id] = [];
      });
      
      setChannelProgress(initialProgress);
      setChannelMessages(initialMessages);
      
      if (channelData.length > 0 && generatedScenario.questions) {
        setActiveChannel(channelData[0].id);
        loadChannelQuestions(channelData[0].id, generatedScenario.questions);
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

  const loadChannelQuestions = (channelId: string, questions: Question[]) => {
    const channelQuestions = questions.filter(q => q.channel === channelId);
    if (channelQuestions.length === 0) return;
    
    const firstQuestion = channelQuestions[0];
    const questionMessages: Message[] = [];
    
    // Add context messages from team members
    firstQuestion.context.forEach((ctx, idx) => {
      questionMessages.push({
        id: `${channelId}-context-${idx}`,
        role: "agent",
        author: ctx.agent,
        content: ctx.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // Add the main question
    questionMessages.push({
      id: `${channelId}-${firstQuestion.id}`,
      role: "agent",
      author: firstQuestion.context[0]?.agent || "Team",
      content: firstQuestion.mainQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stimulus: firstQuestion.stimulus,
    });

    setChannelMessages(prev => ({ ...prev, [channelId]: questionMessages }));
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
    
    setChannelMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMessage]
    }));

    const progress = channelProgress[activeChannel];
    if (!progress) {
      console.error('No progress found for channel:', activeChannel);
      return;
    }

    const channelQuestions = scenario.questions.filter((q: Question) => q.channel === activeChannel);
    const currentQuestion = channelQuestions[progress.questionIndex];
    
    if (!currentQuestion) {
      console.error('No current question found');
      return;
    }
    
    const questionId = progress.followUpIndex === 0 
      ? currentQuestion.id 
      : currentQuestion.followUps?.[progress.followUpIndex - 1]?.id;

    try {
      await supabase.from('simulation_responses').insert({
        simulation_id: simulationId,
        question_id: questionId,
        response,
      });

      // Move to next follow-up or question
      if (currentQuestion.followUps && progress.followUpIndex < currentQuestion.followUps.length) {
        const followUp = currentQuestion.followUps[progress.followUpIndex];
        setTimeout(() => {
          const followUpMessage: Message = {
            id: `${activeChannel}-${followUp.id}`,
            role: "agent",
            author: followUp.agent,
            content: followUp.question,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          
          setChannelMessages(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), followUpMessage]
          }));
          
          setChannelProgress(prev => ({
            ...prev,
            [activeChannel]: { ...prev[activeChannel], followUpIndex: prev[activeChannel].followUpIndex + 1 }
          }));
        }, 1000);
      } else if (progress.questionIndex < channelQuestions.length - 1) {
        // Move to next question with context dialogue
        setTimeout(() => {
          const nextQuestion = channelQuestions[progress.questionIndex + 1];
          
          // Add context messages from team members first
          let cumulativeDelay = 0;
          nextQuestion.context.forEach((ctx, idx) => {
            setTimeout(() => {
              const contextMessage: Message = {
                id: `${activeChannel}-context-${progress.questionIndex + 1}-${idx}`,
                role: "agent",
                author: ctx.agent,
                content: ctx.message,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              
              setChannelMessages(prev => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), contextMessage]
              }));
            }, cumulativeDelay);
            
            cumulativeDelay += 1500;
          });
          
          // Then add the main question
          setTimeout(() => {
            const questionMessage: Message = {
              id: `${activeChannel}-${nextQuestion.id}`,
              role: "agent",
              author: nextQuestion.context[0]?.agent || "Team",
              content: nextQuestion.mainQuestion,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              stimulus: nextQuestion.stimulus,
            };
            
            setChannelMessages(prev => ({
              ...prev,
              [activeChannel]: [...(prev[activeChannel] || []), questionMessage]
            }));
            
            setChannelProgress(prev => ({
              ...prev,
              [activeChannel]: { questionIndex: prev[activeChannel].questionIndex + 1, followUpIndex: 0, completed: false }
            }));
          }, cumulativeDelay + 1000);
        }, 1000);
      } else {
        // Channel completed
        setTimeout(() => {
          const completionMessage: Message = {
            id: `${activeChannel}-completion`,
            role: "agent",
            author: "System",
            content: "🎉 Escalation resolved! Great work. Please proceed to the next channel.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          
          setChannelMessages(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), completionMessage]
          }));
          
          setChannelProgress(prev => ({
            ...prev,
            [activeChannel]: { ...prev[activeChannel], completed: true }
          }));
          
          // Update channel to show completion
          setChannels(prev => prev.map(ch => 
            ch.id === activeChannel ? { ...ch, locked: true } : ch
          ));
        }, 1000);
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
      
      navigate(`/analytics/${simulationId}`);
    } catch (error) {
      console.error('Error submitting simulation:', error);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmitSimulation();
  };

  if (loading || authLoading) {
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
        onViolation={handleViolation}
        simulationId={simulationId!}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatArea
          channelName={activeChannel}
          messages={channelMessages[activeChannel] || []}
          onSendResponse={handleSendResponse}
          onSubmitSimulation={handleSubmitSimulation}
          violations={violations}
        />
      </div>
    </div>
  );
};

export default Simulation;

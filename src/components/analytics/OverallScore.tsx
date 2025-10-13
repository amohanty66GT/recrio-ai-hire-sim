import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OverallScoreProps {
  score: number;
}

export const OverallScore = ({ score }: OverallScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-muted-foreground">
          Overall Startup Readiness Index
        </h2>
        <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </div>
        <p className="text-xl text-muted-foreground">{getScoreLabel(score)}</p>
        <Progress value={score} className="h-3" />
      </div>
    </Card>
  );
};

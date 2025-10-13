import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
}

export const ScoreCard = ({ title, score, description }: ScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="space-y-2">
        <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </Card>
  );
};

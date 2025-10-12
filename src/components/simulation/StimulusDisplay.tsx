interface StimulusDisplayProps {
  type: "code" | "document" | "data";
  title: string;
  content: string;
}

export const StimulusDisplay = ({ type, title, content }: StimulusDisplayProps) => {
  const getIcon = () => {
    switch (type) {
      case "code":
        return "📄";
      case "document":
        return "📋";
      case "data":
        return "📊";
      default:
        return "📎";
    }
  };

  return (
    <div className="my-4 border border-border rounded-lg overflow-hidden bg-muted/30">
      <div className="px-4 py-2 bg-muted border-b border-border flex items-center gap-2">
        <span>{getIcon()}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground ml-auto uppercase">{type}</span>
      </div>
      <div className="p-4">
        <pre className="text-sm text-foreground whitespace-pre-wrap font-mono bg-background/50 p-3 rounded overflow-x-auto">
          {content}
        </pre>
      </div>
    </div>
  );
};

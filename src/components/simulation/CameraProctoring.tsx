import { useCameraProctoring } from "@/hooks/useCameraProctoring";

interface CameraProctoringProps {
  onViolation: (type: string) => void;
}

export const CameraProctoring = ({ onViolation }: CameraProctoringProps) => {
  const { videoRef, isInitialized, cameraError } = useCameraProctoring({
    onViolation,
    enabled: true,
  });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-48 h-36 rounded-lg border-2 border-border object-cover"
          muted
          playsInline
        />
        {!isInitialized && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <p className="text-sm text-muted-foreground">Initializing camera...</p>
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 rounded-lg">
            <p className="text-sm text-destructive-foreground">{cameraError}</p>
          </div>
        )}
        <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

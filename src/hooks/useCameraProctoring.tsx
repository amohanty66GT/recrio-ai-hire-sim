import { useEffect, useRef, useState } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

interface CameraProctoringOptions {
  onViolation: (type: string) => void;
  enabled: boolean;
}

export const useCameraProctoring = ({ onViolation, enabled }: CameraProctoringOptions) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const lastFaceDetectionTime = useRef<number>(Date.now());
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Initialize MediaPipe Face Detector
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });

        faceDetectorRef.current = detector;
        setIsInitialized(true);
        startFaceDetection();
      } catch (error) {
        console.error('Camera access error:', error);
        setCameraError('Camera access denied');
        onViolation('camera_disabled');
      }
    };

    const startFaceDetection = () => {
      detectionIntervalRef.current = setInterval(() => {
        if (videoRef.current && faceDetectorRef.current && videoRef.current.readyState === 4) {
          const detections = faceDetectorRef.current.detectForVideo(
            videoRef.current,
            Date.now()
          );

          if (detections.detections.length === 0) {
            // No face detected
            if (Date.now() - lastFaceDetectionTime.current > 3000) {
              onViolation('no_face_detected');
              lastFaceDetectionTime.current = Date.now();
            }
          } else if (detections.detections.length > 1) {
            // Multiple faces detected
            onViolation('multiple_faces');
            lastFaceDetectionTime.current = Date.now();
          } else {
            // Face detected normally
            lastFaceDetectionTime.current = Date.now();
          }
        }
      }, 1000);
    };

    initCamera();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      faceDetectorRef.current?.close();
    };
  }, [enabled, onViolation]);

  return { videoRef, isInitialized, cameraError };
};

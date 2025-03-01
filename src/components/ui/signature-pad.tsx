
import React, { useRef, useEffect, useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  className,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set up drawing style
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#000000";
    };

    // Initialize canvas and load existing signature
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Load existing signature if available
    if (value) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
      };
      img.src = value;
    }

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [value]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    setIsDrawing(true);
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.closePath();
    setIsDrawing(false);
    
    // Save signature as base64 string
    const signatureData = canvas.toDataURL("image/png");
    onChange(signatureData);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div
        className="border border-gray-300 rounded-md bg-white touch-none"
        style={{ height: "200px", width: "100%" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          className="self-end"
        >
          Borrar firma
        </Button>
      )}
    </div>
  );
};

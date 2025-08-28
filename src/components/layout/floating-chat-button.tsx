import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show the button if we're already on the chat page
  if (location.pathname === "/app/chat") {
    return null;
  }

  return (
    <Button
      onClick={() => navigate("/app/chat")}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
      size="icon"
    >
      <MessageSquare size={24} />
      <span className="sr-only">Abrir Chat Médico</span>
    </Button>
  );
};
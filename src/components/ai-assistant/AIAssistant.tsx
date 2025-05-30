
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, X, HistoryIcon, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AssistantMessage } from "@/types/ai-assistant-types";

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    // Cargar historial desde localStorage al inicializar
    const savedMessages = localStorage.getItem('nexusAssistantHistory');
    return savedMessages 
      ? JSON.parse(savedMessages) 
      : [
          {
            id: "welcome",
            content: "Hola, soy Nexus. Puedo ayudarte con información del sistema. ¿Qué necesitas saber?",
            sender: "assistant",
            timestamp: new Date(),
          }
        ];
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Guardar historial en localStorage cada vez que cambian los mensajes
  useEffect(() => {
    localStorage.setItem('nexusAssistantHistory', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const generateContextualResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    const responses: { [key: string]: string } = {
      "cuántos pacientes hay": "Actualmente hay 127 pacientes registrados en el sistema.",
      "pacientes activos": "Tenemos 89 pacientes activos en este momento.",
      "total facturado": "El total facturado hasta la fecha es de $356,890.00 MXN.",
      
      "médicos disponibles": "Hay 8 doctores disponibles para consultas hoy.",
      "consultorios": "El Consultorio 3 tiene actualmente un 87% de ocupación.",
      
      "citas": "El departamento de cardiología ha atendido 43 pacientes este mes.",
      "tiempo de espera": "El tiempo promedio de espera para citas es de 18 minutos.",
      
      "default": "Lo siento, no tengo información específica sobre esa consulta. ¿Podrías ser más específico?"
    };

    const matchingResponses = Object.entries(responses)
      .filter(([key]) => lowerQuery.includes(key))
      .map(([_, response]) => response);

    return matchingResponses.length > 0 
      ? matchingResponses[0] 
      : responses["default"];
  };

  const handleSend = () => {
    if (input.trim() === "") return;

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    const assistantMessage: AssistantMessage = {
      id: (Date.now() + 1).toString(),
      content: generateContextualResponse(input),
      sender: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleClearHistory = () => {
    const welcomeMessage = messages.find(m => m.id === "welcome");
    setMessages(welcomeMessage ? [welcomeMessage] : []);
    localStorage.removeItem('nexusAssistantHistory');
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-0 flex items-center justify-center hover:shadow-xl transition-all hover:scale-105 border-2 border-white dark:border-gray-800 z-50"
        aria-label="Asistente IA"
      >
        <Brain className="h-6 w-6 animate-pulse" />
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh] rounded-t-xl">
          <DrawerHeader className="border-b pb-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500">
                  <AvatarFallback className="text-white">
                    <Sparkles size={16} />
                  </AvatarFallback>
                </Avatar>
                <DrawerTitle className="text-xl font-semibold">Nexus</DrawerTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearHistory}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full h-8 w-8"
                  title="Limpiar historial"
                >
                  <Trash2 size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full h-8 w-8"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Tu asistente virtual inteligente</p>
          </DrawerHeader>
          
          <ScrollArea 
            className="flex-1 p-4 h-[50vh] overflow-y-auto" 
            ref={scrollAreaRef}
          >
            <div className="space-y-4 pb-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-gray-800 rounded-bl-none"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.sender === "user"
                          ? "text-purple-100"
                          : "text-gray-500"
                      )}
                    >
                      {message.timestamp instanceof Date 
                        ? message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </p>
                  </div>
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <DrawerFooter className="border-t mt-0 pt-4 pb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Pregúntame sobre el sistema..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                className="border-gray-300 dark:border-gray-700 focus-visible:ring-purple-500"
              />
              <Button 
                onClick={handleSend}
                className="bg-purple-600 hover:bg-purple-700"
                size="icon"
              >
                <Brain size={18} />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Puedo ayudarte con estadísticas, información del sistema y más.
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default AIAssistant;

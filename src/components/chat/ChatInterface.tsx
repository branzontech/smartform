import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderType: "user" | "doctor";
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  online: boolean;
};

type ChatInterfaceProps = {
  selectedDoctor: Doctor | null;
  onBack: () => void;
};

export const ChatInterface = ({ selectedDoctor, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for demo
  useEffect(() => {
    if (selectedDoctor) {
      const mockMessages: Message[] = [
        {
          id: "1",
          senderId: selectedDoctor.id,
          senderName: selectedDoctor.name,
          senderType: "doctor",
          content: "Hola, ¿en qué puedo ayudarte hoy?",
          timestamp: new Date(Date.now() - 3600000),
          status: "read"
        },
        {
          id: "2",
          senderId: "user-1",
          senderName: "Paciente",
          senderType: "user",
          content: "Buenos días, doctor. He estado sintiendo dolores de cabeza frecuentes.",
          timestamp: new Date(Date.now() - 3300000),
          status: "read"
        },
        {
          id: "3",
          senderId: selectedDoctor.id,
          senderName: selectedDoctor.name,
          senderType: "doctor",
          content: "Entiendo. ¿Desde cuándo has estado experimentando estos dolores? ¿Hay algún patrón específico?",
          timestamp: new Date(Date.now() - 3000000),
          status: "read"
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedDoctor]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedDoctor) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "user-1",
      senderName: "Paciente",
      senderType: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
      status: "sent"
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");

    // Simulate doctor response after 2-3 seconds
    setTimeout(() => {
      const doctorResponse: Message = {
        id: (Date.now() + 1).toString(),
        senderId: selectedDoctor.id,
        senderName: selectedDoctor.name,
        senderType: "doctor",
        content: getDoctorResponse(inputMessage),
        timestamp: new Date(),
        status: "sent"
      };
      setMessages(prev => [...prev, doctorResponse]);
    }, 2000 + Math.random() * 1000);
  };

  const getDoctorResponse = (userMessage: string): string => {
    const responses = [
      "Gracias por compartir esa información. ¿Podrías describirme con más detalle los síntomas?",
      "Entiendo tu preocupación. Te recomendaría agendar una cita para un examen más detallado.",
      "Basándome en lo que me comentas, hay algunas opciones de tratamiento que podríamos considerar.",
      "Es importante que monitoreemos estos síntomas. ¿Has notado algún factor desencadenante?",
      "Te voy a recetar algunos estudios para tener un diagnóstico más preciso."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedDoctor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecciona un médico
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Elige un médico de la lista para comenzar una conversación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
            ←
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedDoctor.avatar} />
            <AvatarFallback>
              {selectedDoctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {selectedDoctor.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDoctor.specialty} • {selectedDoctor.online ? "En línea" : "Desconectado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone size={18} />
          </Button>
          <Button variant="ghost" size="sm">
            <Video size={18} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end gap-2 max-w-[70%] ${
                message.senderType === "user" ? "flex-row-reverse" : "flex-row"
              }`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.senderType === "doctor" ? selectedDoctor.avatar : undefined} />
                  <AvatarFallback className="text-xs">
                    {message.senderType === "doctor" 
                      ? selectedDoctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                      : "TU"
                    }
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.senderType === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderType === "user" 
                      ? "text-primary-foreground/70" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {format(message.timestamp, "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip size={18} />
          </Button>
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="border-0 bg-gray-100 dark:bg-gray-800 focus-visible:ring-1"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            size="sm"
            className="px-3"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
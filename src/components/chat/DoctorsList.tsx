import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  online: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
};

type DoctorsListProps = {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onSelectDoctor: (doctor: Doctor) => void;
};

export const DoctorsList = ({ doctors, selectedDoctor, onSelectDoctor }: DoctorsListProps) => {
  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Médicos Disponibles
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {doctors.filter(d => d.online).length} en línea
        </p>
      </div>

      {/* Doctors List */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-2">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => onSelectDoctor(doctor)}
              className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                selectedDoctor?.id === doctor.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={doctor.avatar} />
                    <AvatarFallback>
                      {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                    doctor.online ? "bg-green-500" : "bg-gray-400"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {doctor.name}
                    </h3>
                    {doctor.unreadCount && doctor.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {doctor.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {doctor.specialty}
                  </p>

                  {doctor.lastMessage && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                        {doctor.lastMessage}
                      </p>
                      {doctor.lastMessageTime && (
                        <span className="text-xs text-gray-400 ml-2">
                          {format(doctor.lastMessageTime, "HH:mm", { locale: es })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
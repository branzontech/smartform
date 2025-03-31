
import React, { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcedimientoCardProps {
  title: string;
  description: string;
  duration?: string;
  price?: string;
  tags?: string[];
  icon?: ReactNode;
  children?: ReactNode;
}

export function ProcedimientoCard({ 
  title, 
  description, 
  duration, 
  price, 
  tags = [],
  icon,
  children 
}: ProcedimientoCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-purple-600 dark:text-purple-400">
                {icon}
              </div>
            )}
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          {price && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              {price}
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {children}
        
        <div className="flex flex-wrap gap-2 mt-3">
          {duration && (
            <Badge variant="secondary">
              Duración: {duration}
            </Badge>
          )}
          
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

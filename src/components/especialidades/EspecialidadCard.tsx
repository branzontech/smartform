
import React, { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface EspecialidadCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  linkText?: string;
  linkUrl?: string;
  children?: ReactNode;
  footerContent?: ReactNode;
}

export function EspecialidadCard({ 
  title, 
  description, 
  icon, 
  linkText, 
  linkUrl, 
  children,
  footerContent
}: EspecialidadCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 transition-all hover:shadow-md">
      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
            {icon}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {children}
      </CardContent>
      {(linkText && linkUrl) || footerContent ? (
        <CardFooter className="flex justify-between bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
          {footerContent}
          
          {linkText && linkUrl && (
            <Link to={linkUrl}>
              <Button variant="ghost" className="group">
                {linkText}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}

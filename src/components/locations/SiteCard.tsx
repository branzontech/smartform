
import React from 'react';
import { Link } from 'react-router-dom';
import { Site } from '@/types/location-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building, Phone, Mail, Clock, Edit, Trash } from "lucide-react";

interface SiteCardProps {
  site: Site;
  onEdit?: (site: Site) => void;
  onDelete?: (siteId: string) => void;
}

export const SiteCard = ({ site, onEdit, onDelete }: SiteCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-800">
      {site.image && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={site.image} 
            alt={site.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{site.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin size={14} className="mr-1 text-gray-500" />
              {site.address}, {site.city}
              {site.postalCode && ` - ${site.postalCode}`}
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center">
            <Building size={14} className="mr-1" />
            {site.totalOffices} consultorios
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="text-sm space-y-2 pb-4">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Phone size={14} className="mr-2" />
          {site.phone}
        </div>
        
        {site.email && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Mail size={14} className="mr-2" />
            {site.email}
          </div>
        )}
        
        {site.openingHours && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Clock size={14} className="mr-2" />
            {site.openingHours}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="default" asChild>
          <Link to={`/app/locations/sites/${site.id}`}>
            Ver consultorios
          </Link>
        </Button>
        
        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="outline" size="icon" onClick={() => onEdit(site)}>
              <Edit size={16} />
            </Button>
          )}
          
          {onDelete && (
            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => onDelete(site.id)}>
              <Trash size={16} />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};


import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Cake, 
  MapPin, 
  Tag, 
  FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types/customer-types";

interface CustomerContactProps {
  customer: Customer;
}

export const CustomerContact = ({ customer }: CustomerContactProps) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
          <CardDescription>
            Detalles de contacto del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.email && (
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full text-purple-600 dark:text-purple-300 flex-shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm text-muted-foreground break-words">{customer.email}</div>
                <Button variant="link" size="sm" className="h-6 p-0 text-purple-600 dark:text-purple-400" asChild>
                  <a href={`mailto:${customer.email}`}>Enviar correo</a>
                </Button>
              </div>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-start gap-3">
              <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full text-green-600 dark:text-green-300 flex-shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Teléfono</div>
                <div className="text-sm text-muted-foreground break-words">{customer.phone}</div>
                <Button variant="link" size="sm" className="h-6 p-0 text-green-600 dark:text-green-400" asChild>
                  <a href={`tel:${customer.phone}`}>Llamar</a>
                </Button>
              </div>
            </div>
          )}
          
          {customer.whatsapp && (
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-full text-emerald-600 dark:text-emerald-300 flex-shrink-0">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">WhatsApp</div>
                <div className="text-sm text-muted-foreground break-words">{customer.whatsapp}</div>
                <Button variant="link" size="sm" className="h-6 p-0 text-emerald-600 dark:text-emerald-400" asChild>
                  <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    Enviar mensaje
                  </a>
                </Button>
              </div>
            </div>
          )}
          
          {customer.birthday && (
            <div className="flex items-start gap-3">
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full text-red-600 dark:text-red-300 flex-shrink-0">
                <Cake className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Cumpleaños</div>
                <div className="text-sm text-muted-foreground break-words">
                  {customer.birthday.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
          
          {customer.address && (
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full text-blue-600 dark:text-blue-300 flex-shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Dirección</div>
                <div className="text-sm text-muted-foreground break-words">{customer.address}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Etiquetas</CardTitle>
            <CardDescription>
              Etiquetas asignadas al cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {customer.tags && customer.tags.length > 0 ? (
                customer.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay etiquetas asignadas</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Notas</CardTitle>
            <CardDescription>
              Notas internas sobre el cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-md min-h-[100px] relative">
              {customer.notes ? (
                <p className="text-sm whitespace-pre-line break-words">{customer.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No hay notas para este cliente</p>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

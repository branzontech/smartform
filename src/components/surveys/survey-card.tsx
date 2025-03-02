
import { Clock, Copy, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { Survey } from "./types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SurveyCardProps {
  survey: Survey;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const SurveyCard = ({
  survey,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}: SurveyCardProps) => {
  const statusColor = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  const statusText = {
    draft: "Borrador",
    published: "Publicada",
    closed: "Cerrada",
  };

  const timeAgo = formatDistanceToNow(new Date(survey.updatedAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div>
          <h3 className="text-lg font-medium line-clamp-1">{survey.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>Actualizada {timeAgo}</span>
          </div>
        </div>
        <Badge className={statusColor[survey.status]}>
          {statusText[survey.status]}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {survey.description || "Sin descripción"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onView(survey.id)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Eye size={16} className="mr-1" />
            Ver
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(survey.id)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Edit size={16} className="mr-1" />
            Editar
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(survey.id)}>
              <Copy size={16} className="mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(survey.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

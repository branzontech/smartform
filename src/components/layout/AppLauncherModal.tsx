import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mainNavItems } from "@/config/navigation";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppLauncherModal = ({ isOpen, onClose }: AppLauncherModalProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten all menu items for the grid
  const getAllItems = () => {
    const items: Array<{ title: string; path: string; icon: React.ElementType; category?: string }> = [];
    
    mainNavItems.forEach((item) => {
      if (item.items && item.items.length > 0) {
        item.items.forEach((subItem) => {
          items.push({
            ...subItem,
            category: item.title
          });
        });
      } else if (item.path !== "#") {
        items.push({
          title: item.title,
          path: item.path,
          icon: item.icon,
        });
      }
    });
    
    return items;
  };

  const allItems = getAllItems();
  
  const filteredItems = allItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemClick = (path: string) => {
    navigate(path);
    onClose();
    setSearchQuery("");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
      setSearchQuery("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30 
            }}
            className="relative w-full max-w-4xl bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold text-foreground">Aplicaciones</h2>
              <button
                onClick={() => {
                  onClose();
                  setSearchQuery("");
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aplicaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 rounded-xl h-11 focus-visible:ring-primary/30"
                  autoFocus
                />
              </div>
            </div>

            {/* Apps Grid */}
            <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {filteredItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleItemClick(item.path)}
                      className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-200 shadow-lg group-hover:shadow-xl">
                        <IconComponent className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                          {item.title}
                        </span>
                        {item.category && (
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron aplicaciones
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Presiona <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">ESC</kbd> para cerrar
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DockItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning" | "danger";
  isActive?: boolean;
  disabled?: boolean;
}

interface DockProps {
  items: DockItem[];
  className?: string;
  position?: "bottom" | "top";
  magnification?: number;
  baseSize?: number;
}

const BADGE_VARIANTS = {
  default: "bg-primary text-primary-foreground",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-destructive text-destructive-foreground",
};

function DockIcon({
  item,
  mouseX,
  magnification,
  baseSize,
}: {
  item: DockItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  magnification: number;
  baseSize: number;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distance,
    [-150, 0, 150],
    [baseSize, magnification, baseSize]
  );

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const Icon = item.icon;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <motion.button
          ref={ref}
          style={{ width, height: width }}
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(
            "relative flex items-center justify-center rounded-2xl transition-colors",
            "bg-card/80 backdrop-blur-md border border-border/50",
            "hover:bg-primary/10 hover:border-primary/30",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            item.isActive && "bg-primary/15 border-primary/40 shadow-lg shadow-primary/20",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ y: -8 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            className="flex items-center justify-center"
            style={{
              width: useTransform(width, (w) => w * 0.5),
              height: useTransform(width, (w) => w * 0.5),
            }}
          >
            <Icon className="w-full h-full text-foreground" />
          </motion.div>

          {/* Badge */}
          {item.badge !== undefined && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1",
                "text-[10px] font-semibold rounded-full flex items-center justify-center",
                BADGE_VARIANTS[item.badgeVariant || "default"]
              )}
            >
              {item.badge}
            </motion.span>
          )}

          {/* Active indicator */}
          {item.isActive && (
            <motion.div
              layoutId="dock-active-indicator"
              className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={12}
        className="rounded-xl bg-card/95 backdrop-blur-xl border-border/50 px-3 py-1.5"
      >
        <span className="text-sm font-medium">{item.label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function Dock({
  items,
  className,
  position = "bottom",
  magnification = 64,
  baseSize = 48,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(container);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [checkScroll, items]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = baseSize + 16; // item size + gap
    container.scrollBy({
      left: direction === "left" ? -scrollAmount * 2 : scrollAmount * 2,
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      initial={{ y: position === "bottom" ? 100 : -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: position === "bottom" ? 100 : -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "fixed z-50",
        position === "bottom" ? "bottom-6" : "top-6",
        "left-0 right-0 flex justify-center",
        className
      )}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "flex items-center gap-1 p-3",
          "bg-card/80 backdrop-blur-xl",
          "border border-border/50 rounded-3xl",
          "shadow-2xl shadow-black/10"
        )}
      >
        {/* Left scroll indicator */}
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("left")}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex items-end gap-4 overflow-x-auto scrollbar-hide",
            "max-w-[calc(100vw-120px)] md:max-w-[600px]",
            "scroll-smooth"
          )}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {items.map((item) => (
            <DockIcon
              key={item.id}
              item={item}
              mouseX={mouseX}
              magnification={magnification}
              baseSize={baseSize}
            />
          ))}
        </div>

        {/* Right scroll indicator */}
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("right")}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// CSS helper for hiding scrollbar
const scrollbarHideStyles = `
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleId = "dock-scrollbar-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = scrollbarHideStyles;
    document.head.appendChild(style);
  }
}

export type { DockProps };

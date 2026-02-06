import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
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

export interface DockActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  variant: "success" | "danger" | "warning" | "default" | "primary";
  disabled?: boolean;
}

interface DockProps {
  items: DockItem[];
  actionItems?: DockActionItem[];
  showActions?: boolean;
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

const ACTION_VARIANTS = {
  success: {
    bg: "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  danger: {
    bg: "bg-red-500/15 hover:bg-red-500/25 border-red-500/30",
    text: "text-red-600 dark:text-red-400",
  },
  warning: {
    bg: "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  default: {
    bg: "bg-muted/50 hover:bg-muted/80 border-border/30",
    text: "text-muted-foreground",
  },
  primary: {
    bg: "bg-primary/15 hover:bg-primary/25 border-primary/30",
    text: "text-primary",
  },
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
            "relative flex items-center justify-center rounded-xl transition-colors",
            "bg-transparent",
            "hover:bg-muted/60",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            item.isActive && "bg-primary/15 shadow-sm",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ y: -6 }}
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
            <Icon 
              className={cn(
                "w-full h-full",
                item.isActive ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={1.75}
            />
          </motion.div>

          {/* Badge */}
          {item.badge !== undefined && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
                "text-[10px] font-bold rounded-full flex items-center justify-center",
                "shadow-sm border-2 border-background",
                BADGE_VARIANTS[item.badgeVariant || "default"]
              )}
            >
              {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
            </motion.span>
          )}

          {/* Active indicator dot */}
          {item.isActive && (
            <motion.div
              layoutId="dock-active-indicator"
              className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        align="center"
        sideOffset={8}
        className="rounded-lg bg-popover/95 backdrop-blur-sm border-border/40 px-3 py-1.5 shadow-md"
      >
        <span className="text-sm font-medium">{item.label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function DockActionButton({
  item,
  mouseX,
  baseSize,
}: {
  item: DockActionItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  baseSize: number;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const variants = ACTION_VARIANTS[item.variant];
  const Icon = item.icon;

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distance,
    [-150, 0, 150],
    [baseSize, baseSize * 1.2, baseSize]
  );

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <motion.button
          ref={ref}
          style={{ width, height: width }}
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(
            "relative flex items-center justify-center rounded-xl transition-colors",
            "border",
            variants.bg,
            variants.text,
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ y: -6 }}
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
            <Icon className="w-full h-full" strokeWidth={1.75} />
          </motion.div>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        align="center"
        sideOffset={8}
        className="rounded-lg bg-popover/95 backdrop-blur-sm border-border/40 px-3 py-1.5 shadow-md"
      >
        <span className="text-sm font-medium">{item.label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function Dock({
  items,
  actionItems = [],
  showActions = false,
  className,
  position = "bottom",
  magnification = 56,
  baseSize = 42,
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
    const scrollAmount = baseSize + 16;
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
        "left-0 right-0 flex justify-center pointer-events-none",
        className
      )}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "flex items-center gap-1 px-3 py-2",
          "bg-card/90 backdrop-blur-xl",
          "border border-border/40 rounded-2xl",
          "shadow-lg shadow-black/5",
          "pointer-events-auto"
        )}
        layout
      >
        {/* Left scroll indicator */}
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("left")}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <svg
              width="14"
              height="14"
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

        {/* Navigation items */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex items-center gap-2 overflow-x-auto scrollbar-hide",
            "max-w-[calc(100vw-120px)] md:max-w-[400px]",
            "scroll-smooth py-1"
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
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <svg
              width="14"
              height="14"
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

        {/* Separator & Contextual Actions */}
        <AnimatePresence>
          {showActions && actionItems.length > 0 && (
            <>
              {/* Visual separator */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-8 w-px bg-border/50 mx-2 flex-shrink-0"
              />

              {/* Action buttons */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  opacity: { duration: 0.15 }
                }}
                className="flex items-center gap-2 overflow-hidden"
              >
                {actionItems.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    <DockActionButton item={action} mouseX={mouseX} baseSize={baseSize} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
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

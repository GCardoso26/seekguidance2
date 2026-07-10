"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { TcgLogoImage } from "@/components/judge/TcgLogoImage";
import { getTcgTheme } from "@/styles/tcg-theme";
import { hapticFeedback } from "@/utils/haptic";
import { cn } from "@/lib/utils";
import { TCG_OPTIONS, type TcgOption, type TcgType } from "@/types/judge";

const PRIORITY_TCGS: TcgType[] = ["magic", "pokemon", "yugioh"];

type DragContextValue = {
  draggingId: TcgType | null;
  setDraggingId: (id: TcgType | null) => void;
  dropHover: boolean;
  setDropHover: (hover: boolean) => void;
  onSelect: (id: TcgType) => void;
};

const TCGDragContext = createContext<DragContextValue | null>(null);

function useTcgDragOptional() {
  return useContext(TCGDragContext);
}

type ProviderProps = {
  value: TcgType;
  onChange: (v: TcgType) => void;
  children: ReactNode;
};

export function TCGSelectorProvider({ onChange, children }: ProviderProps) {
  const [draggingId, setDraggingId] = useState<TcgType | null>(null);
  const [dropHover, setDropHover] = useState(false);

  const onSelect = useCallback(
    (id: TcgType) => {
      hapticFeedback("light");
      onChange(id);
      setDraggingId(null);
      setDropHover(false);
    },
    [onChange],
  );

  return (
    <TCGDragContext.Provider
      value={{ draggingId, setDraggingId, dropHover, setDropHover, onSelect }}
    >
      {children}
    </TCGDragContext.Provider>
  );
}

type SelectorProps = {
  value: TcgType;
  onChange: (v: TcgType) => void;
  disabled?: boolean;
  responsePanelId?: string;
  options?: TcgOption[];
  variant?: "default" | "compact";
  showHeader?: boolean;
  isTcgLocked?: (id: TcgType) => boolean;
};

function GameMat({
  game,
  selected,
  disabled,
  onSelect,
  responsePanelId,
  variant = "default",
  isTcgLocked,
}: {
  game: TcgOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  responsePanelId?: string;
  variant?: "default" | "compact";
  isTcgLocked?: (id: TcgType) => boolean;
}) {
  const theme = getTcgTheme(game.id);
  const compact = variant === "compact";
  const locked = isTcgLocked?.(game.id) ?? false;
  const canSelect = game.enabled && !disabled && !locked;
  const dragCtx = useTcgDragOptional();
  const draggingId = dragCtx?.draggingId ?? null;
  const setDraggingId = dragCtx?.setDraggingId ?? (() => {});
  const setDropHover = dragCtx?.setDropHover ?? (() => {});
  const isDragging = draggingId === game.id;
  const touchIdRef = useRef<number | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const dropEl = document.getElementById("tcg-drop-zone");
      if (dropEl && canSelect) {
        const rect = dropEl.getBoundingClientRect();
        const over =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;
        if (over) {
          if (dragCtx) dragCtx.onSelect(game.id);
          else onSelect();
        }
      }
      touchGhostRef.current?.remove();
      touchGhostRef.current = null;
      setDraggingId(null);
      setDropHover(false);
    },
    [canSelect, dragCtx, game.id, onSelect, setDraggingId, setDropHover],
  );

  return (
    <button
      type="button"
      role="tab"
      id={`judge-tcg-tab-${game.id}`}
      aria-selected={selected}
      aria-controls={responsePanelId}
      disabled={!canSelect}
      draggable={canSelect && !compact && !!dragCtx}
      onClick={() => {
        if (!canSelect) return;
        onSelect();
      }}
      onDragStart={(e) => {
        if (!canSelect || !dragCtx) return;
        e.dataTransfer.setData("text/tcg-id", game.id);
        e.dataTransfer.effectAllowed = "move";
        setDraggingId(game.id);
      }}
      onDragEnd={() => setDraggingId(null)}
      onTouchStart={(e) => {
        if (!canSelect || compact || !dragCtx) return;
        const touch = e.changedTouches[0];
        touchIdRef.current = touch.identifier;
        setDraggingId(game.id);

        const ghost = document.createElement("div");
        ghost.className =
          "pointer-events-none fixed z-[100] flex h-16 w-16 items-center justify-center rounded-xl border border-primary/60 bg-card/90 shadow-lg";
        ghost.style.left = `${touch.clientX - 32}px`;
        ghost.style.top = `${touch.clientY - 32}px`;
        ghost.textContent = theme.icon;
        document.body.appendChild(ghost);
        touchGhostRef.current = ghost;
      }}
      onTouchMove={(e) => {
        if (touchIdRef.current == null || !canSelect || compact || !dragCtx) return;
        const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current);
        if (!touch) return;
        e.preventDefault();

        if (touchGhostRef.current) {
          touchGhostRef.current.style.left = `${touch.clientX - 32}px`;
          touchGhostRef.current.style.top = `${touch.clientY - 32}px`;
        }

        const dropEl = document.getElementById("tcg-drop-zone");
        if (dropEl) {
          const rect = dropEl.getBoundingClientRect();
          const over =
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom;
          setDropHover(over);
        }
      }}
      onTouchEnd={(e) => {
        if (touchIdRef.current == null) return;
        const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current);
        touchIdRef.current = null;
        if (touch) finishDrag(touch.clientX, touch.clientY);
        else {
          setDraggingId(null);
          setDropHover(false);
        }
      }}
      onTouchCancel={() => {
        touchIdRef.current = null;
        touchGhostRef.current?.remove();
        touchGhostRef.current = null;
        setDraggingId(null);
        setDropHover(false);
      }}
      title={game.enabled ? `${game.label} — arraste para a mesa` : `${game.label} — em breve`}
      style={{ "--mat-gradient": theme.themeGradient } as CSSProperties}
      className={cn(
        "group judge-game-mat relative flex flex-col items-center justify-between overflow-hidden rounded-xl text-left transition",
        compact ? "min-h-[88px] min-w-[72px] p-2 md:min-w-[80px]" : "min-h-[112px] min-w-[140px] p-3 lg:min-w-[148px]",
        !game.enabled && "cursor-not-allowed opacity-50",
        selected && "judge-game-mat--selected z-10 ring-2 ring-primary/80",
        canSelect && !selected && "hover:brightness-110",
        isDragging && "opacity-40 scale-[0.98]",
      )}
    >
      {!game.enabled && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/55 text-caption font-bold uppercase tracking-wide text-primary-foreground">
          Em breve
        </span>
      )}
      {locked && game.enabled && (
        <span
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-foreground/50 text-foreground"
          title="Disponível no plano Pro — R$ 29/mês. Ver /pricing"
        >
          <Lock className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-overline font-bold uppercase">Pro</span>
        </span>
      )}
      {game.beta && game.enabled && (
        <span className="absolute right-2 top-2 z-10 animate-pulse rounded bg-primary/90 px-1.5 py-0.5 text-overline font-bold uppercase text-black">
          Beta
        </span>
      )}

      <TcgLogoImage
        tcgId={game.id}
        variant={variant}
        selected={selected}
        priority={PRIORITY_TCGS.includes(game.id)}
        className="mb-2"
      />

      <div className="w-full text-center">
        {!compact && (
          <span className="text-caption font-black tracking-tight text-foreground/80">{theme.icon}</span>
        )}
        <p
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-[var(--tcg-text-primary)]",
            compact ? "text-caption" : "mt-0.5 text-xs",
          )}
        >
          {compact ? theme.icon : game.label}
        </p>
      </div>
    </button>
  );
}

export function TCGSelector({
  value,
  onChange,
  disabled,
  responsePanelId,
  options = TCG_OPTIONS,
  variant = "default",
  showHeader = true,
  isTcgLocked,
}: SelectorProps) {
  const dragCtx = useTcgDragOptional();
  const selected = options.find((g) => g.id === value);
  const selectedTheme = selected ? getTcgTheme(selected.id) : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const compact = variant === "compact";
  const handleSelect = useCallback(
    (id: TcgType) => {
      if (dragCtx) dragCtx.onSelect(id);
      else {
        hapticFeedback("light");
        onChange(id);
      }
    },
    [dragCtx, onChange],
  );

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (compact) return;
    const el = scrollRef.current;
    if (!el) return;
    updateScrollHints();
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      ro.disconnect();
    };
  }, [compact, updateScrollHints]);

  function scrollBy(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {showHeader && (
        <div className="flex items-end justify-between gap-2">
          <p
            className={cn(
              "font-semibold uppercase tracking-wide text-[var(--tcg-text-secondary)]",
              compact ? "text-caption" : "text-xs",
            )}
          >
            {compact ? "Jogos suportados" : "Escolha o tapete de jogo"}
          </p>
          {selectedTheme && !compact && (
            <p className="hidden text-caption text-[var(--tcg-text-secondary)] sm:block">
              {selectedTheme.publisher}
            </p>
          )}
        </div>
      )}

      {!compact && (
        <p className="text-caption text-[var(--tcg-text-secondary)] md:hidden">
          Toque e arraste um TCG até a mesa central
        </p>
      )}

      <div className="relative lg:px-1">
        {!compact && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="judge-tcg-scroll-btn absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
            aria-label="Jogos anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!compact && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="judge-tcg-scroll-btn absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
            aria-label="Mais jogos"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className={cn(
            compact
              ? "grid grid-cols-4 gap-3 md:grid-cols-7"
              : "flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]",
          )}
          role="tablist"
          aria-label="Selecionar jogo"
        >
          {options.map((g) => (
            <GameMat
              key={g.id}
              game={g}
              selected={value === g.id}
              disabled={!!disabled}
              onSelect={() => handleSelect(g.id)}
              responsePanelId={responsePanelId}
              variant={variant}
              isTcgLocked={isTcgLocked}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type DropZoneProps = {
  children: ReactNode;
  className?: string;
};

export function TCGDropZone({ children, className }: DropZoneProps) {
  const dragCtx = useTcgDragOptional();
  if (!dragCtx) return <div className={className}>{children}</div>;

  const { dropHover, setDropHover, onSelect } = dragCtx;

  return (
    <div
      id="tcg-drop-zone"
      className={cn(
        "rounded-2xl border-2 border-dashed transition-all duration-300",
        dropHover
          ? "border-primary bg-primary/10"
          : "border-transparent bg-transparent",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDropHover(true);
      }}
      onDragLeave={() => setDropHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropHover(false);
        const id = e.dataTransfer.getData("text/tcg-id") as TcgType;
        if (id) onSelect(id);
      }}
    >
      {dropHover && (
        <p className="mb-2 text-center text-sm font-semibold text-primary">Solte aqui!</p>
      )}
      {!dropHover && (
        <p className="mb-2 text-center text-xs text-[var(--tcg-text-secondary)] md:hidden">
          Arraste um TCG para a mesa
        </p>
      )}
      {children}
    </div>
  );
}

export function TCGSelectorWithProvider(props: SelectorProps) {
  return (
    <TCGSelectorProvider value={props.value} onChange={props.onChange}>
      <TCGSelector {...props} />
    </TCGSelectorProvider>
  );
}

/** @deprecated Use TCGSelector */
export const TcgSelector = TCGSelector;

import type { ReactNode } from "react";
import type { OrderStatus } from "@/lib/types";
import { Logo } from "./icons";

export function money(n: number): string {
  return `${Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ")} ₽`;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      <span className="text-white">NEO</span>
      <span className="text-grad-blue">ACC</span>
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo
        className={
          compact
            ? "h-7 w-7"
            : "h-8 w-8 drop-shadow-[0_6px_18px_rgba(59,130,246,0.55)]"
        }
      />
      <Wordmark className={compact ? "text-lg" : "text-xl"} />
    </div>
  );
}

type Accent = "blue" | "amber" | "violet" | "slate";

const accentRing: Record<Accent, string> = {
  blue: "border-brand-400/40 text-brand-300",
  amber: "border-amber-glow/40 text-amber-glow",
  violet: "border-violet-glow/40 text-violet-300",
  slate: "border-white/15 text-slate-300",
};

const accentCore: Record<Accent, string> = {
  blue: "from-brand-500 to-cyan-glow shadow-[0_0_40px_-6px_rgba(59,130,246,0.8)]",
  amber: "from-amber-400 to-amber-glow shadow-[0_0_40px_-6px_rgba(245,183,64,0.7)]",
  violet: "from-violet-500 to-fuchsia-400 shadow-[0_0_40px_-6px_rgba(139,92,246,0.7)]",
  slate: "from-slate-600 to-slate-500",
};

export function PulseRings({ accent = "blue" }: { accent?: Accent }) {
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      {[0, 0.7, 1.4].map((d, i) => (
        <span
          key={i}
          className={`pulse-ring absolute inset-0 rounded-full border ${accentRing[accent]}`}
          style={{ animationDelay: `${d}s` }}
        />
      ))}
      <span
        className={`core-breath relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${accentCore[accent]} text-ink-950`}
      >
        <span className="block h-3 w-3 rounded-full bg-ink-950/85" />
      </span>
    </div>
  );
}

export function EmptyState({
  accent = "blue",
  title,
  subtitle,
  action,
}: {
  accent?: Accent;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-up flex flex-col items-center px-6 py-14 text-center">
      <PulseRings accent={accent} />
      <h3 className="font-display mt-7 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-slate-400">{subtitle}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Badge — redesigned: glassy dark chip, no yellow, never inverts.        */
/* ---------------------------------------------------------------------- */
type BadgeTone = "cyan" | "violet" | "white" | "emerald" | "rose";

const badgeTone: Record<BadgeTone, string> = {
  cyan: "border-cyan-glow/40 text-cyan-200 shadow-[0_0_18px_-6px_rgba(56,189,248,0.9)]",
  violet: "border-violet-glow/40 text-violet-200 shadow-[0_0_18px_-6px_rgba(139,92,246,0.9)]",
  white: "border-white/25 text-slate-100 shadow-[0_0_18px_-8px_rgba(255,255,255,0.6)]",
  emerald: "border-emerald-400/40 text-emerald-200 shadow-[0_0_18px_-6px_rgba(16,185,129,0.8)]",
  rose: "border-rose-400/40 text-rose-200 shadow-[0_0_18px_-6px_rgba(244,63,94,0.8)]",
};

const badgeDot: Record<BadgeTone, string> = {
  cyan: "bg-cyan-glow",
  violet: "bg-violet-400",
  white: "bg-white",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
};

export function Badge({
  children,
  tone = "cyan",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-ink-950/65 px-2.5 py-1 font-display text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur-md ${badgeTone[tone]} ${className}`}
    >
      <span className={`h-1 w-1 rounded-full ${badgeDot[tone]} dot-blink`} />
      {children}
    </span>
  );
}

/** Map a free-form badge string to a tone so colours stay on-brand. */
export function badgeToneFor(label: string): BadgeTone {
  const l = label.toLowerCase();
  if (l.includes("прем") || l.includes("premium")) return "violet";
  if (l.includes("топ") || l.includes("top") || l.includes("стаб")) return "emerald";
  if (l.includes("new") || l.includes("нов")) return "rose";
  if (l.includes("хит") || l.includes("hit")) return "cyan";
  return "white";
}

/* ---------------------------------------------------------------------- */
/*  PriceMask — the hidden-price pill (??? / от ???)                       */
/* ---------------------------------------------------------------------- */
export function PriceMask({ from = false }: { from?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-2.5 py-1 font-display text-sm font-semibold tracking-[0.08em] text-slate-300">
      {from && <span className="text-[11px] font-medium text-slate-500">от</span>}
      <span className="tabular-nums">???</span>
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/*  PhotoSlot — image or a designed placeholder until a URL is provided    */
/* ---------------------------------------------------------------------- */
export function PhotoSlot({
  src,
  emoji,
  className = "",
  rounded = "rounded-xl",
}: {
  src: string | null | undefined;
  emoji: string;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-ink-800 ${rounded} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className={`relative grid place-items-center overflow-hidden border border-white/8 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-800 ${rounded} ${className}`}
    >
      {/* diagonal texture */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(147,197,253,0.06) 0 2px, transparent 2px 12px)",
        }}
      />
      {/* soft spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_35%,rgba(59,130,246,0.22),transparent_70%)]" />
      <span className="relative text-4xl opacity-90 drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)]">
        {emoji}
      </span>
      <span className="absolute bottom-1.5 right-2 rounded border border-white/10 bg-ink-950/60 px-1.5 py-0.5 font-display text-[8px] uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
        photo
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  StatusChip                                                             */
/* ---------------------------------------------------------------------- */
const statusMap = {
  buyer: {
    pending: { label: "Ожидает подтверждения", tone: "amber" },
    approved: { label: "Выполнен", tone: "blue" },
    rejected: { label: "Ошибка оплаты", tone: "rose" },
  },
  admin: {
    pending: { label: "В ожидании", tone: "amber" },
    approved: { label: "Принят", tone: "blue" },
    rejected: { label: "Отклонён", tone: "rose" },
  },
} as const;

const toneClass: Record<string, string> = {
  amber: "bg-amber-glow/12 text-amber-200 border-amber-glow/30",
  blue: "bg-brand-500/15 text-brand-300 border-brand-400/30",
  rose: "bg-rose-500/12 text-rose-300 border-rose-400/30",
};

export function StatusChip({
  status,
  audience = "buyer",
}: {
  status: OrderStatus;
  audience?: "buyer" | "admin";
}) {
  const m = statusMap[audience][status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass[m.tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          m.tone === "amber"
            ? "bg-amber-glow dot-blink"
            : m.tone === "blue"
              ? "bg-brand-400"
              : "bg-rose-400"
        }`}
      />
      {m.label}
    </span>
  );
}

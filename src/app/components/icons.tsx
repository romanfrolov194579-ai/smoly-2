import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const BagIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const CartIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21 8H6" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /></svg>
);
export const ReceiptIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 3h12v18l-2.4-1.6L13.2 21l-2.4-1.6L8.4 21 6 19.4V3Z" /><path d="M9 8h6M9 12h6" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6l-7-3Z" /><path d="m9.2 12 2 2 3.6-4" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="m5 12.5 4.2 4.2L19 7" /></svg>
);
export const XIcon = (p: P) => (
  <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const MinusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14" /></svg>
);
export const BoltIcon = (p: P) => (
  <svg {...base} {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const LockIcon = (p: P) => (
  <svg {...base} {...p}><rect x="5" y="10" width="14" height="10" rx="2.5" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></svg>
);
export const ChevronDown = (p: P) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const AlertIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4M12 17.2v.01" /></svg>
);
export const SendIcon = (p: P) => (
  <svg {...base} {...p}><path d="M21 4 3 11l6 2.5L12 21l3-7 6-10Z" /><path d="m9 13.5 4-4" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);

/** Brand mark — a sharp stacked spark, blue→cyan. */
export const Logo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden>
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#93c5fd" />
        <stop offset="0.55" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    <path
      d="M20 2c1.6 7.2 3.8 12.4 9 14.5 2.4 1 5 1.6 9 1.8-9 .6-13.4 3-16 9-.8 1.9-1.4 4.4-2 8.7-.6-4.3-1.2-6.8-2-8.7-2.6-6-7-8.4-16-9 4-.2 6.6-.8 9-1.8C16.2 14.4 18.4 9.2 20 2Z"
      fill="url(#lg)"
    />
    <circle cx="20" cy="20" r="2.3" fill="#04060d" />
  </svg>
);

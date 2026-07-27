"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, setAuth } from "@/lib/api";
import type {
  CartLine,
  Category,
  Order,
  ProductItem,
  Session,
  Subcategory,
} from "@/lib/types";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/products";
import {
  Badge,
  Brand,
  EmptyState,
  PhotoSlot,
  PriceMask,
  StatusChip,
  badgeToneFor,
  money,
} from "@/components/primitives";
import {
  AlertIcon,
  ArrowRight,
  BagIcon,
  CartIcon,
  CheckIcon,
  ChevronDown,
  ClockIcon,
  CopyIcon,
  LockIcon,
  MenuIcon,
  MinusIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";

type View = "shop" | "cart" | "orders" | "profile" | "admin";

interface Ctx {
  session: Session | null;
  view: View;
  setView: (v: View) => void;
  cart: CartLine[];
  addToCart: (line: CartLine) => void;
  setQty: (itemId: string, variantId: string, qty: number) => void;
  removeLine: (itemId: string, variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  toast: (msg: string, tone?: "ok" | "err" | "info") => void;
  openIdentity: () => void;
  bump: number;
  requireSession: () => boolean;
}

const Ctx = createContext<Ctx | null>(null);
function useApp(): Ctx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within <Ctx.Provider>");
  return v;
}

/* ----------------------------- haptic helper ----------------------------- */
function haptic(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* noop in browser */
  }
}
function hapticNotify(type: "success" | "error" | "warning") {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  } catch {
    /* noop */
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pluralItems(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "товар";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "товара";
  return "товаров";
}

/* ========================================================================= */
/*  Root page                                                                */
/* ========================================================================= */
export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [view, setView] = useState<View>("shop");
  const [cart, setCart] = useState<CartLine[]>([]);
  // Catalogue is static data — bundled with the client so the storefront is
  // alive even where the Worker backend is not running (e.g. platform preview).
  const catalog = useMemo(
    () => ({ categories: CATEGORIES, subcategories: SUBCATEGORIES }),
    [],
  );
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: string; id: number } | null>(
    null,
  );
  const [identityOpen, setIdentityOpen] = useState(false);
  const [guest, setGuest] = useState(false);
  const [bump, setBump] = useState(0);
  const hasTg = useRef(false);

  const toast = useCallback((text: string, tone: "ok" | "err" | "info" = "info") => {
    setToastMsg({ text, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  useEffect(() => {
    (async () => {
      try {
        const wa = window.Telegram?.WebApp;
        if (wa) {
          hasTg.current = true;
          wa.ready?.();
          wa.expand?.();
          wa.setHeaderColor?.("#04060d");
          wa.setBackgroundColor?.("#04060d");
          if (wa.initData) setAuth({ initData: wa.initData });
        }
      } catch {
        /* ignore */
      }

      try {
        const { session: s } = await api.me();
        setSession(s);
      } catch {
        if (!hasTg.current && !guest) setIdentityOpen(true);
      } finally {
        setSessionLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = useCallback((line: CartLine) => {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.itemId === line.itemId && p.variantId === line.variantId);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + line.qty };
        return copy;
      }
      return [...prev, line];
    });
    setBump((b) => b + 1);
  }, []);

  const setQty = useCallback((itemId: string, variantId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.itemId === itemId && l.variantId === variantId ? { ...l, qty: Math.max(0, qty) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback((itemId: string, variantId: string) => {
    setCart((prev) => prev.filter((l) => !(l.itemId === itemId && l.variantId === variantId)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, l) => s + l.unitPrice * l.qty, 0), [cart]);

  const openIdentity = useCallback(() => setIdentityOpen(true), []);

  const requireSession = useCallback(() => {
    if (session) return true;
    setIdentityOpen(true);
    return false;
  }, [session]);

  const ctx: Ctx = {
    session,
    view,
    setView: (v) => {
      haptic("light");
      setView(v);
    },
    cart,
    addToCart,
    setQty,
    removeLine,
    clearCart,
    cartCount,
    cartTotal,
    toast,
    openIdentity,
    bump,
    requireSession,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col pb-28">
        <Header onMenu={() => setIdentityOpen(true)} hasSession={!!session} />

        <main className="flex-1 px-4 pt-3">
          {sessionLoading && (
            <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-brand-400 to-cyan-glow" />
            </div>
          )}
          {view === "shop" && <ShopView catalog={catalog} />}
          {view === "cart" && <CartView />}
          {view === "orders" && <OrdersView />}
          {view === "profile" && <ProfileView />}
          {view === "admin" && <AdminView />}
        </main>

        <BottomNav />

        {toastMsg && <Toast text={toastMsg.text} tone={toastMsg.tone} />}
        {identityOpen && (
          <IdentityModal
            onClose={() => {
              setIdentityOpen(false);
              setGuest(true);
            }}
            onPick={async (username) => {
              setAuth({ devUsername: username, initData: "" });
              try {
                const { session: s } = await api.me();
                setSession(s);
                setIdentityOpen(false);
                toast(`Вход выполнен · @${username}`, "ok");
              } catch {
                toast("Не удалось войти", "err");
              }
            }}
          />
        )}
      </div>
    </Ctx.Provider>
  );
}

/* ========================================================================= */
/*  Header                                                                   */
/* ========================================================================= */
function Header({ onMenu, hasSession }: { onMenu: () => void; hasSession: boolean }) {
  const { setView, session } = useApp();
  const [open, setOpen] = useState(false);

  const item = (v: View, label: string, icon: ReactNode, adminOnly = false) => {
    if (adminOnly && !session?.isAdmin) return null;
    return (
      <button
        key={v}
        onClick={() => {
          setView(v);
          setOpen(false);
        }}
        className="press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-brand-300">
          {icon}
        </span>
        {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-30 px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <button onClick={() => setView("shop")} className="press">
          <Brand />
        </button>
        <div className="flex items-center gap-2">
          {!hasSession && (
            <button
              onClick={onMenu}
              className="press rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-300"
            >
              preview
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Меню"
              className="press grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:border-brand-400/40"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="anim-up absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
                  {item("shop", "Каталог", <BagIcon className="h-4 w-4" />)}
                  {item("cart", "Корзина", <CartIcon className="h-4 w-4" />)}
                  {item("orders", "Мои заказы", <ReceiptIcon className="h-4 w-4" />)}
                  {item("profile", "Профиль", <UserIcon className="h-4 w-4" />)}
                  {item("admin", "Админ-панель", <ShieldIcon className="h-4 w-4" />, true)}
                  <div className="my-1 h-px bg-white/10" />
                  <button
                    onClick={() => {
                      setOpen(false);
                      onMenu();
                    }}
                    className="press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/5"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-slate-300">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    Сменить аккаунт
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="hairline mt-3" />
    </header>
  );
}

/* ========================================================================= */
/*  Shop — three-level drill-down                                            */
/* ========================================================================= */
type ShopScreen = "subs" | "items" | "item";

function ShopView({
  catalog,
}: {
  catalog: { categories: Category[]; subcategories: Subcategory[] } | null;
}) {
  const categories = catalog?.categories ?? [];
  const subcategories = catalog?.subcategories ?? [];
  const [catId, setCatId] = useState<Category["id"]>("accounts");
  const catSubs = useMemo(
    () => subcategories.filter((s) => s.categoryId === catId),
    [subcategories, catId],
  );
  const [subId, setSubId] = useState<string>(catSubs[0]?.id ?? "");
  const sub = useMemo(
    () => catSubs.find((s) => s.id === subId) ?? catSubs[0],
    [catSubs, subId],
  );
  const [itemId, setItemId] = useState<string>("");
  const activeItem = useMemo(() => sub?.items.find((i) => i.id === itemId), [sub, itemId]);
  const [screen, setScreen] = useState<ShopScreen>("subs");

  // reset drill when category changes
  useEffect(() => {
    setSubId(catSubs[0]?.id ?? "");
    setItemId("");
    setScreen("subs");
  }, [catId, catSubs]);

  const openSub = (id: string) => {
    haptic("light");
    setSubId(id);
    setScreen("items");
  };
  const openItem = (id: string) => {
    haptic("medium");
    setItemId(id);
    setScreen("item");
  };
  const back = () => {
    haptic("light");
    setScreen((s) => (s === "item" ? "items" : "subs"));
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="anim-up flex items-end justify-between" style={{ animationDelay: "40ms" }}>
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-blink" />
            выдача 24/7
          </div>
          <h1 className="font-display text-[34px] font-bold leading-[1.05] text-white">
            Маркет
            <br />
            <span className="text-slate-400">аккаунтов</span>
          </h1>
        </div>
        <div className="mb-1 hidden flex-col items-end text-right sm:flex">
          <span className="text-[11px] text-slate-500">направлений</span>
          <span className="font-display text-lg font-semibold text-white">
            {subcategories.length}
          </span>
        </div>
      </div>

      {/* Category pills */}
      <div className="anim-up flex flex-wrap gap-2.5" style={{ animationDelay: "90ms" }}>
        {categories.map((c) => {
          const active = c.id === catId;
          const grad =
            c.accent === "blue"
              ? "from-brand-500 to-cyan-glow"
              : c.accent === "amber"
                ? "from-amber-400 to-amber-glow"
                : "from-violet-500 to-fuchsia-400";
          const glow = c.accent === "blue" ? "glow-blue" : c.accent === "amber" ? "glow-amber" : "glow-violet";
          const count = subcategories.filter((s) => s.categoryId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => {
                haptic("light");
                setCatId(c.id);
              }}
              className={`press relative overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold ${
                active
                  ? `bg-gradient-to-r text-ink-950 ${grad} ${glow}`
                  : "border border-white/10 bg-white/[0.03] text-slate-200"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {c.label}
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                    active ? "bg-ink-950/20 text-ink-950" : "bg-white/5 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Drill body */}
      {screen === "subs" && (
        <SubsList subs={catSubs} onPick={openSub} />
      )}
      {screen === "items" && sub && (
        <ItemsList sub={sub} onBack={back} onPick={openItem} />
      )}
      {screen === "item" && sub && activeItem && (
        <ProductPage sub={sub} item={activeItem} onBack={back} />
      )}
    </div>
  );
}

/* ---- Level B: subcategories of a category ---- */
function SubsList({
  subs,
  onPick,
}: {
  subs: Subcategory[];
  onPick: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <SectionArrow title="Выбери направление" />
      {subs.length === 0 ? (
        <EmptyState title="Пусто" subtitle="В этой категории пока нет направлений." />
      ) : (
        <div className="space-y-2.5">
          {subs.map((s, i) => {
            const multi = s.items.length > 1;
            return (
              <button
                key={s.id}
                onClick={() => onPick(s.id)}
                className="anim-up panel lift press flex w-full items-center gap-3 p-3 text-left"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-white/8 to-white/[0.02] text-2xl ring-1 ring-white/8">
                  {s.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-semibold text-white">
                      {s.name}
                    </span>
                    {s.badge && <Badge tone={badgeToneFor(s.badge)}>{s.badge}</Badge>}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {s.items.length} {pluralItems(s.items.length)} внутри
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <PriceMask from={multi} />
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    открыть
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---- Level C: items inside a subcategory ---- */
function ItemsList({
  sub,
  onBack,
  onPick,
}: {
  sub: Subcategory;
  onBack: () => void;
  onPick: (id: string) => void;
}) {
  const single = sub.items.length === 1;
  return (
    <section className="space-y-3">
      <DrillHeader
        onBack={onBack}
        kicker="направление"
        title={sub.name}
        right={sub.badge ? <Badge tone={badgeToneFor(sub.badge)}>{sub.badge}</Badge> : undefined}
      />
      <div className={single ? "space-y-3" : "grid grid-cols-2 gap-3"}>
        {sub.items.map((it, i) => (
          <ProductCard
            key={it.id}
            item={it}
            emoji={sub.emoji}
            wide={single}
            onPick={() => onPick(it.id)}
            delay={i * 50}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  item,
  emoji,
  wide,
  onPick,
  delay,
}: {
  item: ProductItem;
  emoji: string;
  wide: boolean;
  onPick: () => void;
  delay: number;
}) {
  if (wide) {
    return (
      <button
        onClick={onPick}
        className="anim-up panel lift press flex w-full gap-3 p-2.5 text-left"
        style={{ animationDelay: `${delay}ms` }}
      >
        <PhotoSlot
          src={item.photo}
          emoji={emoji}
          className="w-32 shrink-0 self-stretch"
          rounded="rounded-xl"
        />
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="font-display text-base font-semibold leading-tight text-white">
            {item.name}
          </div>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-400">{item.short}</p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-display text-base font-bold text-white tabular-nums">
              {money(item.price)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-brand-300">
              подробнее <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </button>
    );
  }
  return (
    <button
      onClick={onPick}
      className="anim-up panel lift press flex w-full flex-col overflow-hidden p-2 text-left"
      style={{ animationDelay: `${delay}ms` }}
    >
      <PhotoSlot src={item.photo} emoji={emoji} className="aspect-[4/3] w-full" rounded="rounded-xl" />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-2">
        <div className="line-clamp-2 font-display text-[13px] font-semibold leading-tight text-white">
          {item.name}
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-400">{item.short}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-sm font-bold text-white tabular-nums">
            {money(item.price)}
          </span>
          <ArrowRight className="h-4 w-4 text-brand-300" />
        </div>
      </div>
    </button>
  );
}

/* ---- Level D: dedicated product page ---- */
function ProductPage({
  sub,
  item,
  onBack,
}: {
  sub: Subcategory;
  item: ProductItem;
  onBack: () => void;
}) {
  const { addToCart, toast } = useApp();
  const [variantId, setVariantId] = useState<string>(item.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);

  // reset choices when item changes
  useEffect(() => {
    setVariantId(item.variants[0]?.id ?? "");
    setQty(1);
  }, [item]);

  const variant = item.variants.find((v) => v.id === variantId) ?? item.variants[0];
  const unitPrice = item.price + (variant?.delta ?? 0);
  const lineTotal = unitPrice * qty;

  const onAdd = () => {
    haptic("medium");
    hapticNotify("success");
    addToCart({
      itemId: item.id,
      subId: sub.id,
      subName: sub.name,
      name: item.name,
      emoji: sub.emoji,
      categoryId: sub.categoryId,
      variantId: variant.id,
      variantLabel: variant.label,
      qty,
      unitPrice,
    });
    toast(`${item.name} · ${qty} шт. в корзине`, "ok");
  };

  return (
    <section className="space-y-4">
      <DrillHeader onBack={onBack} kicker={sub.name} title={item.name} />

      <div className="anim-up relative" style={{ animationDelay: "40ms" }}>
        <PhotoSlot
          src={item.photo}
          emoji={sub.emoji}
          className="aspect-[16/10] w-full"
          rounded="rounded-2xl"
        />
        {sub.badge && (
          <div className="absolute left-3 top-3">
            <Badge tone={badgeToneFor(sub.badge)}>{sub.badge}</Badge>
          </div>
        )}
      </div>

      <div className="anim-up flex items-end justify-between gap-3" style={{ animationDelay: "80ms" }}>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/70">
            {sub.name}
          </div>
          <h2 className="font-display mt-0.5 text-xl font-bold leading-tight text-white">
            {item.name}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">цена</div>
          <div className="font-display text-2xl font-bold text-white tabular-nums">
            {money(unitPrice)}
          </div>
        </div>
      </div>

      <p
        className="anim-up rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 text-sm leading-relaxed text-slate-300"
        style={{ animationDelay: "120ms" }}
      >
        {item.description}
      </p>

      <div className="anim-up flex flex-wrap gap-2" style={{ animationDelay: "160ms" }}>
        {item.perks.map((perk) => (
          <span
            key={perk}
            className="rounded-full border border-brand-400/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-200"
          >
            {perk}
          </span>
        ))}
      </div>

      {/* Variants */}
      {item.variants.length > 1 && (
        <div className="anim-up" style={{ animationDelay: "200ms" }}>
          <h3 className="font-display mb-2 text-base font-semibold text-white">Вариант</h3>
          <div className="flex flex-wrap gap-2">
            {item.variants.map((v) => {
              const active = v.id === variant.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    haptic("light");
                    setVariantId(v.id);
                  }}
                  className={`press rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                    active
                      ? "border-brand-400/60 bg-gradient-to-br from-brand-600 to-cyan-glow/70 text-white glow-blue"
                      : "border-white/10 bg-white/[0.03] text-slate-200"
                  }`}
                >
                  {v.label}
                  {v.delta > 0 && (
                    <span className={`ml-2 text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                      +{money(v.delta)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="anim-up" style={{ animationDelay: "240ms" }}>
        <h3 className="font-display mb-2 text-base font-semibold text-white">Количество</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03]">
            <button
              onClick={() => {
                haptic("light");
                setQty((q) => Math.max(1, q - 1));
              }}
              className="press grid h-11 w-11 place-items-center text-slate-300"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <input
              value={qty}
              inputMode="numeric"
              onChange={(e) => setQty(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
              className="w-12 bg-transparent text-center font-display text-lg font-semibold text-white outline-none"
            />
            <button
              onClick={() => {
                haptic("light");
                setQty((q) => Math.min(50, q + 1));
              }}
              className="press grid h-11 w-11 place-items-center text-slate-300"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-400"
          />
        </div>
      </div>

      {/* Sticky-ish CTA */}
      <button
        onClick={onAdd}
        className="press anim-up relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-glow px-5 py-4 text-left text-ink-950 shadow-[0_18px_50px_-18px_rgba(59,130,246,0.9)]"
        style={{ animationDelay: "280ms" }}
      >
        <span className="shimmer-line" />
        <span className="relative flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-base font-bold">
            <CartIcon className="h-5 w-5" />
            Добавить в корзину
          </span>
          <span className="font-display text-base font-bold tabular-nums">{money(lineTotal)}</span>
        </span>
      </button>
    </section>
  );
}

function SectionArrow({ title }: { title: string }) {
  return (
    <div className="anim-up flex items-center gap-3" style={{ animationDelay: "130ms" }}>
      <h2 className="font-display whitespace-nowrap text-lg font-semibold text-white">{title}</h2>
      <div className="relative h-px flex-1 bg-gradient-to-r from-white/30 to-transparent">
        <ArrowRight className="absolute -right-1 -top-[9px] h-[18px] w-[18px] text-white/50" />
      </div>
    </div>
  );
}

function DrillHeader({
  onBack,
  kicker,
  title,
  right,
}: {
  onBack: () => void;
  kicker: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="anim-up flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label="Назад"
        className="press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:border-brand-400/40"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/70">
          {kicker}
        </div>
        <h2 className="font-display truncate text-xl font-bold text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ========================================================================= */
/*  Cart                                                                     */
/* ========================================================================= */
function CartView() {
  const { cart, setQty, removeLine, cartTotal, clearCart, toast, requireSession, setView } =
    useApp();
  const [submitting, setSubmitting] = useState(false);

  if (cart.length === 0) {
    return (
      <div>
        <PageTitle kicker="корзина" title="Корзина" />
        <EmptyState
          accent="blue"
          title="Корзина пуста"
          subtitle="Здесь появятся товары, которые ты добавишь из каталога. Выбери направление, открой товар и нажми «В корзину»."
          action={
            <button
              onClick={() => setView("shop")}
              className="press inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-cyan-glow px-5 py-2.5 text-sm font-bold text-ink-950"
            >
              <BagIcon className="h-4 w-4" /> К каталогу
            </button>
          }
        />
      </div>
    );
  }

  const checkout = async () => {
    if (!requireSession()) return;
    haptic("medium");
    setSubmitting(true);
    try {
      const { order } = await api.createOrder(cart);
      hapticNotify("success");
      clearCart();
      toast(`Заказ #${order.id} создан`, "ok");
      setView("orders");
    } catch (e) {
      hapticNotify("error");
      toast(e instanceof Error ? e.message : "Ошибка оформления", "err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle kicker="корзина" title={`Корзина · ${cart.length}`} />
      <div className="space-y-3">
        {cart.map((l, i) => (
          <div
            key={`${l.itemId}-${l.variantId}`}
            className="anim-up panel flex gap-3 p-3"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">
              {l.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{l.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    {l.subName} · {l.variantLabel}
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptic("light");
                    removeLine(l.itemId, l.variantId);
                  }}
                  className="press grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label="Удалить"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03]">
                  <button
                    onClick={() => setQty(l.itemId, l.variantId, l.qty - 1)}
                    className="press grid h-8 w-8 place-items-center text-slate-300"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-white tabular-nums">
                    {l.qty}
                  </span>
                  <button
                    onClick={() => setQty(l.itemId, l.variantId, l.qty + 1)}
                    className="press grid h-8 w-8 place-items-center text-slate-300"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white tabular-nums">
                    {money(l.unitPrice * l.qty)}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {money(l.unitPrice)} / шт
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel anim-up space-y-3 p-4">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Позиций</span>
          <span className="tabular-nums text-slate-200">{cart.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Итого</span>
          <span className="font-display text-2xl font-bold text-white tabular-nums">
            {money(cartTotal)}
          </span>
        </div>
        <button
          onClick={checkout}
          disabled={submitting}
          className="press relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-glow px-5 py-3.5 font-display font-bold text-ink-950 disabled:opacity-60"
        >
          <span className="shimmer-line" />
          <span className="relative flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/40 border-t-ink-950" />
                Оформляем…
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4" /> Оформить заказ
              </>
            )}
          </span>
        </button>
        <button
          onClick={() => {
            haptic("light");
            clearCart();
          }}
          className="press w-full rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:text-rose-300"
        >
          Очистить корзину
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  Orders                                                                   */
/* ========================================================================= */
function OrdersView() {
  const { session, toast, requireSession, setView } = useApp();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const { orders: o } = await api.myOrders();
      setOrders(o);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    }
  }, [session]);

  useEffect(() => {
    if (requireSession()) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) {
    return (
      <div>
        <PageTitle kicker="история" title="Заказы" />
        <EmptyState
          accent="blue"
          title="Войдите, чтобы видеть заказы"
          subtitle="История покупок и статусы выдачи привязаны к вашему Telegram-аккаунту."
        />
      </div>
    );
  }

  if (err) {
    return (
      <div>
        <PageTitle kicker="история" title="Заказы" />
        <EmptyState accent="violet" title="Не удалось загрузить" subtitle={err} />
      </div>
    );
  }

  if (orders === null) {
    return (
      <div>
        <PageTitle kicker="история" title="Заказы" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <PageTitle kicker="история" title="Заказы" />
        <EmptyState
          accent="blue"
          title="Заказов пока нет"
          subtitle="Как только оформишь первую покупку — здесь появится её статус и данные для входа."
          action={
            <button
              onClick={() => setView("shop")}
              className="press inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-cyan-glow px-5 py-2.5 text-sm font-bold text-ink-950"
            >
              <BagIcon className="h-4 w-4" /> Открыть каталог
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle kicker="история" title={`Заказы · ${orders.length}`} />
      <div className="space-y-3">
        {orders.map((o, i) => (
          <OrderCard key={o.id} order={o} index={i} onAct={load} toast={toast} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  index,
  onAct,
  toast,
}: {
  order: Order;
  index: number;
  onAct: () => void;
  toast: (m: string, t?: "ok" | "err" | "info") => void;
}) {
  const [open, setOpen] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("Скопировано", "ok"),
      () => toast("Не удалось скопировать", "err"),
    );
  };

  return (
    <div className="anim-up panel overflow-hidden" style={{ animationDelay: `${index * 50}ms` }}>
      <button
        onClick={() => {
          haptic("light");
          setOpen((o) => !o);
        }}
        className="press flex w-full items-center gap-3 p-3.5 text-left"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600/60 to-cyan-glow/30 font-display text-sm font-bold text-white">
          #{order.id.slice(0, 3)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-white">#{order.id}</span>
            <StatusChip status={order.status} audience="buyer" />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
            <ClockIcon className="h-3.5 w-3.5" />
            {fmtDate(order.createdAt)} · {order.lines.reduce((s, l) => s + l.qty, 0)} шт
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-base font-bold text-white tabular-nums">
            {money(order.total)}
          </div>
          <ChevronDown
            className={`ml-auto mt-1 h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-3.5 pb-3.5 pt-3">
          <div className="space-y-1.5">
            {order.lines.map((l) => (
              <div key={l.itemId} className="flex items-center gap-2 text-sm">
                <span className="text-base">{l.emoji}</span>
                <span className="flex-1 text-slate-200">
                  {l.name} <span className="text-slate-500">· {l.variantLabel}</span>
                </span>
                <span className="text-slate-400 tabular-nums">×{l.qty}</span>
                <span className="w-20 text-right text-slate-200 tabular-nums">
                  {money(l.lineTotal)}
                </span>
              </div>
            ))}
          </div>

          {order.status === "approved" && order.delivered && (
            <div className="mt-3 space-y-2 rounded-xl border border-brand-400/20 bg-brand-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-200">
                <CheckIcon className="h-4 w-4" /> Данные для входа
              </div>
              {order.delivered.flatMap((d) =>
                d.accounts.map((a, idx) => (
                  <div
                    key={`${d.itemId}-${idx}`}
                    className="rounded-lg border border-white/5 bg-ink-950/60 p-2.5 font-mono text-[12px] text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        <span className="text-slate-500">login:</span> {a.login}
                      </span>
                      <button
                        onClick={() => copy(a.login)}
                        className="press shrink-0 text-slate-500 hover:text-brand-300"
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        <span className="text-slate-500">pass:</span> {a.password}
                      </span>
                      <button
                        onClick={() => copy(a.password)}
                        className="press shrink-0 text-slate-500 hover:text-brand-300"
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {a.note && <div className="mt-1 text-[11px] text-slate-500">{a.note}</div>}
                  </div>
                )),
              )}
            </div>
          )}

          {order.status === "rejected" && (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3">
              <AlertIcon className="h-5 w-5 shrink-0 text-rose-300" />
              <div className="text-xs leading-relaxed text-rose-100/90">
                <div className="font-semibold text-rose-200">Ошибка оплаты · #{order.id}</div>
                Платёж не прошёл проверку платёжной системы — транзакция отклонена на стороне
                эквайера. Средства не списаны. Попробуйте повторить попытку позже или выберите
                другой способ оплаты в поддержке.
              </div>
            </div>
          )}

          {order.status === "pending" && (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-amber-glow/25 bg-amber-glow/10 p-3">
              <ClockIcon className="h-5 w-5 shrink-0 text-amber-200" />
              <div className="text-xs leading-relaxed text-amber-100/90">
                Заказ передан оператору на подтверждение. Обычно это занимает до 10 минут. Как
                только платёж будет проверен — статус обновится автоматически.
              </div>
            </div>
          )}

          <button
            onClick={onAct}
            className="press mt-3 w-full rounded-xl border border-white/10 py-2 text-xs text-slate-400 hover:text-slate-200"
          >
            Обновить статус
          </button>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/*  Profile                                                                  */
/* ========================================================================= */
function ProfileView() {
  const { session, setView, openIdentity } = useApp();

  if (!session) {
    return (
      <div>
        <PageTitle kicker="профиль" title="Профиль" />
        <EmptyState
          accent="violet"
          title="Профиль не определён"
          subtitle="Откройте мини-приложение из Telegram или войдите в preview-режиме."
          action={
            <button
              onClick={openIdentity}
              className="press inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-cyan-glow px-5 py-2.5 text-sm font-bold text-ink-950"
            >
              <UserIcon className="h-4 w-4" /> Войти
            </button>
          }
        />
      </div>
    );
  }

  const initials = (session.firstName ?? session.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <PageTitle kicker="профиль" title="Профиль" />
      <div className="panel anim-up relative overflow-hidden p-5">
        <div className="shimmer-line opacity-30" />
        <div className="flex items-center gap-4">
          <div className="relative">
            {session.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.photoUrl}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-brand-400/40"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-glow font-display text-xl font-bold text-ink-950">
                {initials}
              </div>
            )}
            {session.isAdmin && (
              <span className="badge-pop absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-glow text-ink-950 shadow-lg">
                <ShieldIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-white">
                {session.firstName ?? "Пользователь"}
              </span>
              {session.demo && (
                <span className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300">
                  preview
                </span>
              )}
            </div>
            <div className="text-sm text-brand-300">
              {session.username ? `@${session.username}` : "без username"}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">ID {session.id}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Роль" value={session.isAdmin ? "Админ" : "Покупатель"} />
          <Stat label="Канал выдачи" value="TG · авто" />
        </div>
      </div>

      <div className="space-y-2">
        <NavRow
          icon={<ReceiptIcon className="h-4 w-4" />}
          label="Мои заказы"
          onClick={() => setView("orders")}
        />
        {session.isAdmin && (
          <NavRow
            icon={<ShieldIcon className="h-4 w-4" />}
            label="Админ-панель"
            accent
            onClick={() => setView("admin")}
          />
        )}
        <NavRow
          icon={<UserIcon className="h-4 w-4" />}
          label="Сменить аккаунт"
          onClick={openIdentity}
        />
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-slate-600">
        NEOACC · Telegram Mini App · профиль получен через Telegram WebApp SDK
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function NavRow({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={() => {
        haptic("light");
        onClick();
      }}
      className={`press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm ${
        accent
          ? "border-amber-glow/25 bg-amber-glow/10 text-amber-100"
          : "border-white/10 bg-white/[0.03] text-slate-200"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg ${accent ? "bg-amber-glow/15 text-amber-200" : "bg-white/5 text-brand-300"}`}
      >
        {icon}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <ArrowRight className="h-4 w-4 opacity-50" />
    </button>
  );
}

/* ========================================================================= */
/*  Admin                                                                    */
/* ========================================================================= */
function AdminView() {
  const { session, toast } = useApp();
  const [data, setData] = useState<{
    stats: import("@/lib/types").ShopStats;
    recent: Order[];
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api.stats();
      setData(d);
    } catch {
      /* forbidden handled by guard */
    }
  }, []);

  useEffect(() => {
    if (session?.isAdmin) load();
  }, [session, load]);

  if (!session?.isAdmin) {
    return (
      <div>
        <PageTitle kicker="доступ закрыт" title="Админ-панель" />
        <EmptyState
          accent="violet"
          title="Только для админов"
          subtitle="Этот раздел доступен владельцам магазина. Если это вы — войдите под своим TG-аккаунтом."
        />
      </div>
    );
  }

  const act = async (id: string, action: "accept" | "reject") => {
    haptic(action === "accept" ? "medium" : "heavy");
    setBusy(id);
    try {
      await api.act(id, action);
      hapticNotify(action === "accept" ? "success" : "warning");
      toast(
        action === "accept" ? `#${id} принят` : `#${id} отклонён`,
        action === "accept" ? "ok" : "err",
      );
      await load();
    } catch (e) {
      hapticNotify("error");
      toast(e instanceof Error ? e.message : "Ошибка", "err");
    } finally {
      setBusy(null);
    }
  };

  const stats = data?.stats;
  const orders = (data?.recent ?? []).filter((o) =>
    filter === "all" ? true : o.status === filter,
  );

  return (
    <div className="space-y-4">
      <PageTitle kicker="управление" title="Админ-панель" />

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Общий доход"
            value={money(stats.totalRevenue)}
            sub={`${stats.approvedCount} выполнено`}
            accent="blue"
            big
          />
          <StatCard
            label="В ожидании"
            value={money(stats.pendingSum)}
            sub={`${stats.pendingCount} заказов`}
            accent="amber"
            big
          />
          <StatCard
            label="Отклонено"
            value={money(stats.rejectedSum)}
            sub={`${stats.rejectedCount} шт`}
            accent="violet"
          />
          <StatCard
            label="Всего заказов"
            value={String(stats.totalOrders)}
            sub="за всё время"
            accent="slate"
          />
        </div>
      )}

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(
          [
            ["pending", "В ожидании"],
            ["all", "Все"],
            ["approved", "Принятые"],
            ["rejected", "Отклонённые"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              haptic("light");
              setFilter(id);
            }}
            className={`press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              filter === id
                ? "border-brand-400/50 bg-brand-500/15 text-brand-200"
                : "border-white/10 bg-white/[0.03] text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="panel h-32 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          accent="amber"
          title="Здесь пока пусто"
          subtitle={
            filter === "pending"
              ? "Новые заказы появятся здесь в реальном времени — с пульсацией, чтобы не пропустить."
              : "По выбранному фильтру заказов нет."
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => (
            <div
              key={o.id}
              className="anim-up panel p-3.5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600/60 to-cyan-glow/30 font-display text-xs font-bold text-white">
                    {(o.username ?? o.firstName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-white">#{o.id}</span>
                      <StatusChip status={o.status} audience="admin" />
                    </div>
                    <div className="text-xs text-slate-400">
                      {o.username ? `@${o.username}` : o.firstName ?? "—"} · {fmtDate(o.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="font-display text-base font-bold text-white tabular-nums">
                  {money(o.total)}
                </div>
              </div>

              <div className="mt-3 space-y-1 rounded-xl border border-white/5 bg-ink-950/40 p-2.5 text-xs">
                {o.lines.map((l) => (
                  <div key={l.itemId} className="flex items-center gap-2 text-slate-300">
                    <span>{l.emoji}</span>
                    <span className="flex-1 truncate">
                      {l.name} <span className="text-slate-500">· {l.variantLabel}</span>
                    </span>
                    <span className="tabular-nums text-slate-400">×{l.qty}</span>
                  </div>
                ))}
              </div>

              {o.status === "pending" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    disabled={busy === o.id}
                    onClick={() => act(o.id, "accept")}
                    className="press relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3 py-2.5 text-sm font-bold text-ink-950 disabled:opacity-60"
                  >
                    <span className="relative flex items-center justify-center gap-1.5">
                      <CheckIcon className="h-4 w-4" /> Принять
                    </span>
                  </button>
                  <button
                    disabled={busy === o.id}
                    onClick={() => act(o.id, "reject")}
                    className="press rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm font-bold text-rose-200 disabled:opacity-60"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <XIcon className="h-4 w-4" /> Отклонить
                    </span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">
                  {o.status === "approved"
                    ? `Выдано аккаунтов: ${o.delivered?.reduce((s, d) => s + d.accounts.length, 0) ?? 0}`
                    : "Отклонён — покупателю показано как ошибка оплаты"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  big,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "blue" | "amber" | "violet" | "slate";
  big?: boolean;
}) {
  const ring =
    accent === "blue"
      ? "glow-blue"
      : accent === "amber"
        ? "glow-amber"
        : accent === "violet"
          ? "glow-violet"
          : "";
  const dot =
    accent === "blue"
      ? "bg-brand-400"
      : accent === "amber"
        ? "bg-amber-glow"
        : accent === "violet"
          ? "bg-violet-400"
          : "bg-slate-400";
  return (
    <div className={`panel anim-up relative overflow-hidden p-3.5 ${ring}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div
        className={`mt-1 font-display font-bold text-white tabular-nums ${big ? "text-xl" : "text-lg"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

/* ========================================================================= */
/*  Shared bits                                                              */
/* ========================================================================= */
function PageTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="anim-up mb-1">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300/70">
        {kicker}
      </div>
      <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 pt-4">
      <div className="h-10 w-40 animate-pulse rounded-xl bg-white/5" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-full bg-white/5" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}

function Toast({ text, tone }: { text: string; tone: string }) {
  const color =
    tone === "ok"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
      : tone === "err"
        ? "border-rose-400/30 bg-rose-500/15 text-rose-100"
        : "border-brand-400/30 bg-brand-500/15 text-brand-100";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[60] flex justify-center px-4">
      <div
        className={`badge-pop pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur-xl ${color}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            tone === "ok" ? "bg-emerald-400" : tone === "err" ? "bg-rose-400" : "bg-brand-400"
          }`}
        />
        {text}
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  Bottom navigation                                                        */
/* ========================================================================= */
function BottomNav() {
  const { view, setView, cartCount, bump, session } = useApp();
  const tabs: { id: View; label: string; icon: () => ReactNode; badge?: number }[] = [
    { id: "shop", label: "Каталог", icon: () => <BagIcon className="h-5 w-5" /> },
    { id: "cart", label: "Корзина", badge: cartCount, icon: () => <CartIcon className="h-5 w-5" /> },
    { id: "orders", label: "Заказы", icon: () => <ReceiptIcon className="h-5 w-5" /> },
    { id: "profile", label: "Профиль", icon: () => <UserIcon className="h-5 w-5" /> },
  ];
  if (session?.isAdmin) {
    tabs.push({ id: "admin", label: "Админ", icon: () => <ShieldIcon className="h-5 w-5" /> });
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="flex items-stretch justify-between gap-1 rounded-2xl border border-white/10 bg-ink-900/85 p-1.5 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {tabs.map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="press relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2"
            >
              {active && (
                <span className="absolute -top-1.5 h-1 w-7 rounded-full bg-gradient-to-r from-brand-400 to-cyan-glow shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
              )}
              <span className="relative">
                <span className={active ? "text-brand-300" : "text-slate-500"}>{t.icon()}</span>
                {t.badge ? (
                  <span
                    key={bump}
                    className="badge-pop absolute -right-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-cyan-glow px-1 text-[10px] font-bold text-ink-950"
                  >
                    {t.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={`text-[10px] font-semibold ${active ? "text-white" : "text-slate-500"}`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ========================================================================= */
/*  Identity / preview modal                                                 */
/* ========================================================================= */
function IdentityModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (username: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (u: string) => {
    const clean = u.replace(/^@/, "").trim();
    if (!clean) return;
    setLoading(true);
    await onPick(clean);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/80 px-5 backdrop-blur-md">
      <div className="anim-up panel w-full max-w-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300/70">
              вход
            </div>
            <h3 className="font-display text-xl font-bold text-white">Telegram-профиль</h3>
          </div>
          <button
            onClick={onClose}
            className="press grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          В Telegram профиль подставится автоматически. В браузере введите любой username, чтобы
          продолжить в preview-режиме.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
          <span className="text-slate-500">@</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="username"
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
            onKeyDown={(e) => e.key === "Enter" && submit(name)}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="press rounded-xl border border-white/10 py-2.5 text-sm text-slate-300"
          >
            Пропустить
          </button>
          <button
            disabled={loading || !name.trim()}
            onClick={() => submit(name)}
            className="press relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 to-cyan-glow py-2.5 text-sm font-bold text-ink-950 disabled:opacity-50"
          >
            <span className="shimmer-line" />
            <span className="relative">{loading ? "…" : "Войти"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

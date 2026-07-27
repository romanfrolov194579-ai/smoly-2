// Minimal ambient typings for the Telegram WebApp SDK loaded from
// https://telegram.org/js/telegram-web-app.js — only the surface we use.

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramWebAppUser; query_id?: string; auth_date?: number; hash?: string };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: { isVisible: boolean; show: () => void; hide: () => void; onClick: (cb: () => void) => void };
  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    setText: (t: string) => void;
    onClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setBackgroundColor: (color: string) => void;
  setHeaderColor: (color: string) => void;
  onEvent: (type: string, cb: () => void) => void;
  offEvent: (type: string, cb: () => void) => void;
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}

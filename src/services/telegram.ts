import {
  init,
  backButton,
  mainButton,
  viewport,
  themeParams,
  initData,
  miniApp,
  retrieveLaunchParams,
  openTelegramLink,
  shareURL,
  type LaunchParams,
} from '@telegram-apps/sdk-react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
  photoUrl?: string;
}

class TelegramService {
  private initialized = false;
  private initializing = false;
  private _isTelegramEnvironment = false;
  private _launchParams: LaunchParams | null = null;

  get isTelegramEnvironment(): boolean {
    return this._isTelegramEnvironment;
  }

  get launchParams(): LaunchParams | null {
    return this._launchParams;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this._isTelegramEnvironment;
    }

    // Prevent concurrent initialization (React StrictMode calls twice)
    if (this.initializing) {
      // Wait for the first initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this._isTelegramEnvironment;
    }

    this.initializing = true;

    try {
      // Retrieve launch params - this will throw if not in Telegram
      this._launchParams = retrieveLaunchParams();
      this._isTelegramEnvironment = true;

      // Initialize the SDK
      init();

      // Mount components - check if already mounted first
      // 1. Mount miniApp first (it auto-mounts themeParams)
      if (miniApp.mount.isAvailable() && !miniApp.isMounted()) {
        miniApp.mount();
      }

      // 2. Mount viewport for safe areas
      if (viewport.mount.isAvailable() && !viewport.isMounted()) {
        await viewport.mount();
      }

      // Expand viewport if available
      if (viewport.expand.isAvailable()) {
        viewport.expand();
      }

      // 3. Restore init data for user info
      initData.restore();

      // 4. Signal app is ready
      if (miniApp.ready.isAvailable()) {
        miniApp.ready();
      }

      // 5. Bind CSS variables for theme (creates --tg-theme-* variables)
      if (themeParams.bindCssVars.isAvailable() && !themeParams.isCssVarsBound()) {
        themeParams.bindCssVars();
      }

      if (viewport.bindCssVars.isAvailable() && !viewport.isCssVarsBound()) {
        viewport.bindCssVars();
      }

      this.initialized = true;
      this.initializing = false;
      console.log('Telegram SDK initialized successfully');
      return true;
    } catch (error) {
      console.log('Not running inside Telegram Mini App:', error);
      this._isTelegramEnvironment = false;
      this.initializing = false;
      return false;
    }
  }

  // Get raw init data for backend validation
  getInitDataRaw(): string | undefined {
    // First try the SDK
    const sdkRaw = initData.raw();
    if (sdkRaw) return sdkRaw;

    // Fallback to native Telegram WebApp object
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
      return window.Telegram.WebApp.initData;
    }

    return undefined;
  }

  // Get parsed user data (for display only - validate on backend!)
  getUser(): TelegramUser | undefined {
    const user = initData.user();
    if (!user) return undefined;

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      isPremium: user.is_premium,
      photoUrl: user.photo_url,
    };
  }

  // Get start parameter from Direct Link Mini Apps or URL query
  getStartParam(): string | undefined {
    // Try SDK's initData first
    const sdkStartParam = initData.startParam();
    if (sdkStartParam) return sdkStartParam;

    // Try launch params
    if (this._launchParams?.tgWebAppStartParam) {
      return this._launchParams.tgWebAppStartParam;
    }

    // Fallback: check URL query parameter (for webApp buttons)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const startapp = urlParams.get('startapp');
      if (startapp) return startapp;
    }

    return undefined;
  }

  // Get chat type (for Direct Link Mini Apps)
  getChatType(): string | undefined {
    return initData.chatType();
  }

  // Get chat instance identifier
  getChatInstance(): string | undefined {
    return initData.chatInstance();
  }

  // Get safe area insets
  getSafeAreaInsets() {
    return {
      top: viewport.safeAreaInsetTop() || 0,
      bottom: viewport.safeAreaInsetBottom() || 0,
      left: viewport.safeAreaInsetLeft() || 0,
      right: viewport.safeAreaInsetRight() || 0,
    };
  }

  // Get content safe area (for Telegram UI elements like close button)
  getContentSafeAreaInsets() {
    return {
      top: viewport.contentSafeAreaInsetTop() || 0,
      bottom: viewport.contentSafeAreaInsetBottom() || 0,
    };
  }

  // Show/configure back button
  showBackButton(onClick: () => void): () => void {
    if (!backButton.mount.isAvailable()) {
      return () => {};
    }

    backButton.mount();
    if (backButton.show.isAvailable()) {
      backButton.show();
    }

    const off = backButton.onClick(onClick);

    return () => {
      off();
      if (backButton.hide.isAvailable()) {
        backButton.hide();
      }
    };
  }

  // Hide back button
  hideBackButton(): void {
    if (backButton.hide.isAvailable()) {
      backButton.hide();
    }
  }

  // Show main action button
  showMainButton(
    text: string,
    onClick: () => void,
    options?: {
      backgroundColor?: string;
      textColor?: string;
      hasShineEffect?: boolean;
    }
  ): () => void {
    if (!mainButton.mount.isAvailable()) {
      return () => {};
    }

    mainButton.mount();
    mainButton.setParams({
      text,
      isVisible: true,
      isEnabled: true,
      backgroundColor: options?.backgroundColor as `#${string}` | undefined,
      textColor: options?.textColor as `#${string}` | undefined,
      hasShineEffect: options?.hasShineEffect,
    });

    const off = mainButton.onClick(onClick);

    return () => {
      off();
      mainButton.setParams({ isVisible: false });
    };
  }

  // Set main button loading state
  setMainButtonLoading(loading: boolean): void {
    mainButton.setParams({ isLoaderVisible: loading, isEnabled: !loading });
  }

  // Hide main button
  hideMainButton(): void {
    mainButton.setParams({ isVisible: false });
  }

  // Close the Mini App
  close(): void {
    if (miniApp.close.isAvailable()) {
      miniApp.close();
    }
  }

  // Set header color
  setHeaderColor(color: string): void {
    if (miniApp.setHeaderColor.isAvailable()) {
      miniApp.setHeaderColor(color as 'bg_color' | 'secondary_bg_color');
    }
  }

  // Set background color
  setBackgroundColor(color: string): void {
    if (miniApp.setBackgroundColor.isAvailable()) {
      miniApp.setBackgroundColor(color as `#${string}`);
    }
  }

  // Get theme params
  getThemeParams() {
    const state = themeParams.state();
    return {
      bgColor: state.bg_color,
      textColor: state.text_color,
      buttonColor: state.button_color,
      buttonTextColor: state.button_text_color,
      headerBgColor: state.header_bg_color,
      accentTextColor: state.accent_text_color,
      secondaryBgColor: state.secondary_bg_color,
      hintColor: state.hint_color,
      linkColor: state.link_color,
    };
  }

  // Share URL via Telegram's native share dialog
  shareUrl(url: string, text?: string): boolean {
    if (shareURL.isAvailable()) {
      shareURL(url, text);
      return true;
    }
    return false;
  }

  // Open a Telegram link (e.g., deep link to bot) without closing the Mini App
  openLink(url: string): boolean {
    if (openTelegramLink.isAvailable()) {
      openTelegramLink(url);
      return true;
    }
    return false;
  }

  // Get the bot username from launch params
  getBotUsername(): string | undefined {
    // Extract from tgWebAppBotInline or bot info if available
    // This is typically set up when creating the Mini App
    return this._launchParams?.tgWebAppBotInline
      ? undefined
      : undefined;
  }

  // Generate a Telegram deep link for the Mini App with a start parameter
  generateDeepLink(botUsername: string, startParam: string): string {
    // Format: https://t.me/botusername?startapp=parameter
    return `https://t.me/${botUsername}?startapp=${encodeURIComponent(startParam)}`;
  }
}

export const telegram = new TelegramService();

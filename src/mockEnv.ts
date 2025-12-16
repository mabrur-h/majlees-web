import { mockTelegramEnv, emitEvent } from '@telegram-apps/sdk-react';

const MOCK_THEME_PARAMS = {
  accent_text_color: '#6ab2f2',
  bg_color: '#17212b',
  button_color: '#5288c1',
  button_text_color: '#ffffff',
  destructive_text_color: '#ec3942',
  header_bg_color: '#17212b',
  hint_color: '#708499',
  link_color: '#6ab3f3',
  secondary_bg_color: '#232e3c',
  section_bg_color: '#17212b',
  section_header_text_color: '#6ab3f3',
  subtitle_text_color: '#708499',
  text_color: '#f5f5f5',
} as const;

const noInsets = { left: 0, top: 0, bottom: 0, right: 0 } as const;

export function setupMockTelegramEnv() {
  // Only mock in development and outside Telegram
  if (import.meta.env.PROD) return;

  try {
    // Check if we're already in Telegram (hash contains Telegram data)
    const hash = window.location.hash.slice(1);
    if (hash.includes('tgWebAppData')) {
      console.log('Running inside Telegram, skipping mock');
      return;
    }
  } catch {
    // Continue with mock
  }

  console.warn('Mocking Telegram environment for development');

  mockTelegramEnv({
    launchParams: {
      tgWebAppThemeParams: MOCK_THEME_PARAMS,
      tgWebAppData: new URLSearchParams([
        [
          'user',
          JSON.stringify({
            id: 12345678,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'en',
            is_premium: false,
          }),
        ],
        ['hash', 'mock_hash_for_dev'],
        ['signature', ''],
        ['auth_date', Math.floor(Date.now() / 1000).toString()],
      ]),
      tgWebAppStartParam: 'debug',
      tgWebAppVersion: '8',
      tgWebAppPlatform: 'tdesktop',
    },
    onEvent(e) {
      const [method] = e;

      if (method === 'web_app_request_theme') {
        return emitEvent('theme_changed', { theme_params: MOCK_THEME_PARAMS });
      }
      if (method === 'web_app_request_viewport') {
        return emitEvent('viewport_changed', {
          height: window.innerHeight,
          width: window.innerWidth,
          is_expanded: true,
          is_state_stable: true,
        });
      }
      if (method === 'web_app_request_content_safe_area') {
        return emitEvent('content_safe_area_changed', noInsets);
      }
      if (method === 'web_app_request_safe_area') {
        return emitEvent('safe_area_changed', noInsets);
      }
      if (method === 'web_app_expand') {
        return emitEvent('viewport_changed', {
          height: window.innerHeight,
          width: window.innerWidth,
          is_expanded: true,
          is_state_stable: true,
        });
      }
      if (method === 'web_app_ready') {
        console.log('Mini App ready');
      }
    },
  });
}

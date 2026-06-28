import { browser } from '$app/environment';
import { Persisted } from './persisted.svelte';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeValue = 'light' | 'dark';

const themePreferenceStorageKey = 'dlab-theme-preference';
const rawStringSerde = {
  stringify: (value: ThemePreference) => value,
  parse: (value: string) => value as ThemePreference
};

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isThemeValue(value: unknown): value is ThemeValue {
  return value === 'light' || value === 'dark';
}

function prefersDarkMode(): boolean {
  if (!browser) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

class ThemeController {
  #preference = new Persisted<ThemePreference>(
    themePreferenceStorageKey,
    'dark',
    isThemePreference,
    rawStringSerde
  );
  #systemDark = $state<boolean>(prefersDarkMode());
  #current = $derived.by(() => {
    this.#preference.current;
    this.#systemDark;

    if (this.#preference.current === 'system') {
      return this.#systemDark ? 'dark' : 'light';
    }

    return this.#preference.current;
  });
  #listener: ((event: MediaQueryListEvent) => void) | null = null;

  constructor() {
    if (!browser) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    this.#listener = (event) => {
      this.#systemDark = event.matches;
    };
    media.addEventListener('change', this.#listener);
  }

  get preference() {
    return this.#preference.current;
  }

  set preference(value: ThemePreference) {
    this.#preference.current = value;
  }

  get current() {
    return this.#current;
  }

  get isDark() {
    return this.#current === 'dark';
  }

  set current(value: ThemeValue) {
    if (!isThemeValue(value)) return;
    this.preference = value;
  }

  toggle() {
    this.preference = this.isDark ? 'light' : 'dark';
  }
}

export const theme = new ThemeController();

export function toggleTheme() {
  theme.toggle();
}

export function setThemePreference(value: ThemePreference) {
  theme.preference = value;
}

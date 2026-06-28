import { browser } from '$app/environment';

type Serde<T> = {
  stringify: (value: T) => string;
  parse: (value: string) => T;
};

type Validator<T> = (value: unknown) => value is T;

const defaultSerde: Serde<any> = {
  stringify: (value) => JSON.stringify(value),
  parse: (value) => JSON.parse(value)
};

export class Persisted<T> {
  #current = $state<T>(undefined as T);
  #key: string;
  #serde: Serde<T>;
  #validator: Validator<T>;
  #storageListener?: (event: StorageEvent) => void;

  constructor(key: string, initial: T, validator: Validator<T>, serde: Serde<T> = defaultSerde) {
    this.#key = key;
    this.#serde = serde;
    this.#validator = validator;
    this.#current = initial;

    if (!browser) return;

    this.#hydrate();
    this.#storageListener = (event) => {
      if (event.key !== this.#key) return;
      this.#hydrate();
    };
    window.addEventListener('storage', this.#storageListener);
  }

  #hydrate() {
    const stored = localStorage.getItem(this.#key);
    if (stored === null) return;

    try {
      const parsed = this.#serde.parse(stored);
      if (!this.#validator(parsed)) {
        localStorage.removeItem(this.#key);
        return;
      }
      this.#current = parsed;
    } catch {
      localStorage.removeItem(this.#key);
    }
  }

  get current() {
    return this.#current;
  }

  set current(value: T) {
    this.#current = value;
    if (!browser) return;
    localStorage.setItem(this.#key, this.#serde.stringify(value));
  }
}


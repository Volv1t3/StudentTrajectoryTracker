declare global {
  namespace App {
    interface Locals {
      user: { id: number; role: string; nombres?: string } | null;
      accessToken: string | null;
    }
    interface PageData {}
    interface PageState {}
    interface Error {}
    interface Platform {}
  }
}

export {};

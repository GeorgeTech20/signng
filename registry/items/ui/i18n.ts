import { InjectionToken, type Provider } from '@angular/core';

/**
 * Centralised UI strings for signng components (the labels NOT supplied as component inputs — mostly
 * icon-button aria-labels + a few defaults). Defaults are English; translate the whole library from
 * one place with `provideSignngI18n({...})`. Components read it via `inject(SIGNNG_I18N)`.
 *
 * Per-instance text (label/title/placeholder/triggerLabel/items) is still passed as inputs, and dates
 * are locale-aware via Intl (Calendar/DatePicker `locale` + `weekStartsOn`) — this token covers the rest.
 */
export interface SignngMessages {
  close: string;
  selectPlaceholder: string;
  options: string;
  empty: string;
  searchPlaceholder: string;
  calendarPrevMonth: string;
  calendarNextMonth: string;
  calendarLabel: string;
  paginationLabel: string;
  paginationPrev: string;
  paginationNext: string;
  paginationPage: (n: number) => string;
  carouselLabel: string;
  carouselPrev: string;
  carouselNext: string;
  carouselRoleDescription: string;
  slideRoleDescription: string;
  slideOf: (i: number, total: number) => string;
  sidebarToggle: string;
  sidebarNav: string;
  toastClose: string;
  toastRegion: string;
  menu: string;
  contextMenu: string;
  dialog: string;
  panel: string;
  confirmation: string;
  moreInfo: string;
  datePicker: string;
  resizePanels: string;
  otpGroup: string;
  otpDigit: (i: number, total: number) => string;
}

export const SIGNNG_MESSAGES_EN: SignngMessages = {
  close: 'Close',
  selectPlaceholder: 'Select…',
  options: 'Options',
  empty: 'No results',
  searchPlaceholder: 'Search…',
  calendarPrevMonth: 'Previous month',
  calendarNextMonth: 'Next month',
  calendarLabel: 'Calendar',
  paginationLabel: 'Pagination',
  paginationPrev: 'Previous page',
  paginationNext: 'Next page',
  paginationPage: (n) => `Page ${n}`,
  carouselLabel: 'Carousel',
  carouselPrev: 'Previous slide',
  carouselNext: 'Next slide',
  carouselRoleDescription: 'carousel',
  slideRoleDescription: 'slide',
  slideOf: (i, total) => `${i} of ${total}`,
  sidebarToggle: 'Toggle sidebar',
  sidebarNav: 'Main navigation',
  toastClose: 'Close',
  toastRegion: 'Notifications',
  menu: 'Menu',
  contextMenu: 'Context menu',
  dialog: 'Dialog',
  panel: 'Panel',
  confirmation: 'Confirmation',
  moreInfo: 'More information',
  datePicker: 'Date picker',
  resizePanels: 'Resize panels',
  otpGroup: 'Verification code',
  otpDigit: (i, total) => `Digit ${i} of ${total}`,
};

export const SIGNNG_I18N = new InjectionToken<SignngMessages>('SIGNNG_I18N', {
  providedIn: 'root',
  factory: () => SIGNNG_MESSAGES_EN,
});

/** Provide a (partial) translation of the signng UI strings, merged over the English defaults. */
export function provideSignngI18n(messages: Partial<SignngMessages>): Provider {
  return { provide: SIGNNG_I18N, useValue: { ...SIGNNG_MESSAGES_EN, ...messages } };
}

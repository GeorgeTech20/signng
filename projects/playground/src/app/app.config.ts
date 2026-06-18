import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { provideSignngI18n } from '@/components/ui/i18n';

// Demo: signng defaults to English; this translates every built-in UI string to Spanish from one place.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideSignngI18n({
      close: 'Cerrar',
      selectPlaceholder: 'Seleccionar…',
      options: 'Opciones',
      empty: 'Sin resultados',
      searchPlaceholder: 'Buscar…',
      calendarPrevMonth: 'Mes anterior',
      calendarNextMonth: 'Mes siguiente',
      calendarLabel: 'Calendario',
      paginationLabel: 'Paginación',
      paginationPrev: 'Página anterior',
      paginationNext: 'Página siguiente',
      paginationPage: (n) => `Página ${n}`,
      carouselLabel: 'Carrusel',
      carouselPrev: 'Diapositiva anterior',
      carouselNext: 'Diapositiva siguiente',
      carouselRoleDescription: 'carrusel',
      slideRoleDescription: 'diapositiva',
      slideOf: (i, total) => `${i} de ${total}`,
      sidebarToggle: 'Alternar barra lateral',
      sidebarNav: 'Navegación principal',
      toastClose: 'Cerrar',
      toastRegion: 'Notificaciones',
      menu: 'Menú',
      contextMenu: 'Menú contextual',
      dialog: 'Diálogo',
      panel: 'Panel',
      confirmation: 'Confirmación',
      moreInfo: 'Más información',
      datePicker: 'Selector de fecha',
      resizePanels: 'Redimensionar paneles',
      otpGroup: 'Código de verificación',
      otpDigit: (i, total) => `Dígito ${i} de ${total}`,
    }),
  ],
};

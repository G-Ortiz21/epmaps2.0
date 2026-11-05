import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { obtenerConfiguracionFirebase } from '../config';

/*
 * Único punto donde se inicializa Firebase (ADR-016).
 * initializeAuth solo puede ejecutarse una vez por app: si el módulo se vuelve
 * a evaluar (recarga de Metro), se reutiliza la instancia existente con getAuth.
 */
function crearAuth() {
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp(obtenerConfiguracionFirebase());

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      return getAuth(app);
    }

    throw error;
  }
}

export const auth = crearAuth();

// Idioma de los correos que envía Firebase (recuperación y verificación).
auth.languageCode = 'es';

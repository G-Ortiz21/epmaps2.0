const apiBaseUrlConfigurada = process.env.EXPO_PUBLIC_API_URL;

function validarApiBaseUrl(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error('Configura EXPO_PUBLIC_API_URL con la URL HTTPS de MockAPI.');
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL HTTPS absoluta válida.');
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname.length === 0 ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error(
      'EXPO_PUBLIC_API_URL debe usar HTTPS y no puede contener credenciales, consulta ni fragmento.',
    );
  }

  return url.toString().replace(/\/+$/, '');
}

export const API_BASE_URL = validarApiBaseUrl(apiBaseUrlConfigurada);

export const API_RESOURCES = {
  medidores: 'medidores',
  lecturas: 'lecturas',
} as const;

/*
 * Firebase Authentication (ADR-016).
 * Las seis variables se leen de forma literal: Expo solo inyecta en el bundle
 * las referencias directas process.env.EXPO_PUBLIC_*, no el acceso dinámico.
 */
const NOMBRES_VARIABLES_FIREBASE = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
} as const;

type CampoFirebase = keyof typeof NOMBRES_VARIABLES_FIREBASE;

const variablesFirebaseSinValidar: Record<CampoFirebase, string | undefined> = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function validarVariablesFirebase(): Record<CampoFirebase, string> {
  const problemas: string[] = [];
  const valores: Partial<Record<CampoFirebase, string>> = {};

  (Object.keys(NOMBRES_VARIABLES_FIREBASE) as CampoFirebase[]).forEach(
    (campo) => {
      const nombre = NOMBRES_VARIABLES_FIREBASE[campo];
      const valor = variablesFirebaseSinValidar[campo]?.trim();

      if (valor === undefined || valor.length === 0) {
        problemas.push(`${nombre} no está definida`);
        return;
      }

      if (/\s/.test(valor)) {
        problemas.push(`${nombre} contiene espacios`);
        return;
      }

      valores[campo] = valor;
    },
  );

  const { authDomain, messagingSenderId, appId } = valores;

  if (
    authDomain !== undefined &&
    (!authDomain.includes('.') || /[/\\]/.test(authDomain))
  ) {
    problemas.push(
      `${NOMBRES_VARIABLES_FIREBASE.authDomain} debe ser un dominio, por ejemplo proyecto.firebaseapp.com`,
    );
  }

  if (messagingSenderId !== undefined && !/^\d+$/.test(messagingSenderId)) {
    problemas.push(
      `${NOMBRES_VARIABLES_FIREBASE.messagingSenderId} debe contener solo dígitos`,
    );
  }

  if (appId !== undefined && !/^\d+:[^:\s]+:[^:\s]+:[^:\s]+$/.test(appId)) {
    problemas.push(
      `${NOMBRES_VARIABLES_FIREBASE.appId} debe tener el formato 1:emisor:web:identificador`,
    );
  }

  if (problemas.length > 0) {
    throw new Error(
      `Configuración de Firebase incompleta: ${problemas.join('; ')}. ` +
        'Usa .env.local con la plantilla de .env.example.',
    );
  }

  return valores as Record<CampoFirebase, string>;
}

export function obtenerConfiguracionFirebase(): Record<CampoFirebase, string> {
  return validarVariablesFirebase();
}
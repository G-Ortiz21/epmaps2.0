const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');

const expoLocationMock = {
  Accuracy: { High: 4 },
};
const load = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'expo-location') return expoLocationMock;
  return load.call(this, request, parent, isMain);
};

require.extensions['.ts'] = (modulo, nombreArchivo) => {
  const codigo = fs.readFileSync(nombreArchivo, 'utf8');
  const salida = ts.transpileModule(codigo, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  modulo._compile(salida, nombreArchivo);
};

const { crearUbicacionManual, validarUbicacion } = require('../src/domain/ubicacion.ts');
const {
  capturarUbicacionGPS,
  ErrorUbicacion,
} = require('../src/services/ubicacionService.ts');

function crearProveedor(overrides = {}) {
  return {
    Accuracy: expoLocationMock.Accuracy,
    requestForegroundPermissionsAsync: async () => ({ granted: true }),
    hasServicesEnabledAsync: async () => true,
    getCurrentPositionAsync: async () => ({
      coords: { latitude: -0.2, longitude: -78.5, accuracy: 8 },
    }),
    ...overrides,
  };
}

test('acepta coordenadas GPS completas con precisión dentro del umbral', () => {
  assert.equal(
    validarUbicacion({
      latitud: -0.2,
      longitud: -78.5,
      origenUbicacion: 'gps',
      precisionGps: 50,
    }),
    true,
  );
});

test('rechaza latitud, longitud, pares parciales y valores no finitos', () => {
  const base = {
    latitud: -0.2,
    longitud: -78.5,
    origenUbicacion: 'manual',
    precisionGps: null,
  };
  assert.equal(validarUbicacion({ ...base, latitud: 90.01 }), false);
  assert.equal(validarUbicacion({ ...base, longitud: -180.01 }), false);
  assert.equal(validarUbicacion({ ...base, latitud: Number.NaN }), false);
  assert.equal(validarUbicacion({ ...base, longitud: Number.POSITIVE_INFINITY }), false);
  assert.equal(validarUbicacion({ latitud: base.latitud }), false);
});

test('ubicación manual requiere precisión nula y devuelve origen manual', () => {
  assert.deepEqual(crearUbicacionManual(-0.2, -78.5), {
    latitud: -0.2,
    longitud: -78.5,
    origenUbicacion: 'manual',
    precisionGps: null,
  });
  assert.throws(() => crearUbicacionManual(91, 0), RangeError);
  assert.equal(
    validarUbicacion({
      latitud: 0,
      longitud: 0,
      origenUbicacion: 'manual',
      precisionGps: 1,
    }),
    false,
  );
});

test('GPS solicita permiso de primer plano y devuelve posición puntual', async () => {
  let opcionesRecibidas;
  const ubicacion = await capturarUbicacionGPS(
    crearProveedor({
      getCurrentPositionAsync: async (opciones) => {
        opcionesRecibidas = opciones;
        return { coords: { latitude: -0.2, longitude: -78.5, accuracy: 8 } };
      },
    }),
  );
  assert.deepEqual(ubicacion, {
    latitud: -0.2,
    longitud: -78.5,
    origenUbicacion: 'gps',
    precisionGps: 8,
  });
  assert.equal(opcionesRecibidas.accuracy, expoLocationMock.Accuracy.High);
});

test('permiso denegado termina sin consultar servicios ni posición', async () => {
  let consultas = 0;
  await assert.rejects(
    capturarUbicacionGPS(
      crearProveedor({
        requestForegroundPermissionsAsync: async () => ({ granted: false }),
        hasServicesEnabledAsync: async () => {
          consultas += 1;
          return true;
        },
      }),
    ),
    (error) => error instanceof ErrorUbicacion && error.codigo === 'permiso_denegado',
  );
  assert.equal(consultas, 0);
});

test('servicios apagados producen error y no solicitan una posición', async () => {
  await assert.rejects(
    capturarUbicacionGPS(
      crearProveedor({
        hasServicesEnabledAsync: async () => false,
        getCurrentPositionAsync: async () => {
          throw new Error('must not run');
        },
      }),
    ),
    (error) => error instanceof ErrorUbicacion && error.codigo === 'servicios_desactivados',
  );
});

test('precisión sobre el umbral requiere reintento o selección manual', async () => {
  await assert.rejects(
    capturarUbicacionGPS(
      crearProveedor({
        getCurrentPositionAsync: async () => ({
          coords: { latitude: 0, longitude: 0, accuracy: 50.1 },
        }),
      }),
    ),
    (error) => error instanceof ErrorUbicacion && error.codigo === 'precision_insuficiente',
  );
});

test('una captura que excede el tiempo límite devuelve error tipificado', async () => {
  await assert.rejects(
    capturarUbicacionGPS(
      crearProveedor({
        getCurrentPositionAsync: () => new Promise(() => {}),
      }),
      1,
    ),
    (error) => error instanceof ErrorUbicacion && error.codigo === 'tiempo_agotado',
  );
});

test('posición incompleta y fallo del proveedor se tipifican', async () => {
  await assert.rejects(
    capturarUbicacionGPS(
      crearProveedor({
        getCurrentPositionAsync: async () => ({
          coords: { latitude: 100, longitude: 0, accuracy: 1 },
        }),
      }),
    ),
    (error) => error instanceof ErrorUbicacion && error.codigo === 'posicion_invalida',
  );

  await assert.rejects(
    capturarUbicacionGPS(
      crearProveedor({
        getCurrentPositionAsync: async () => {
          throw new Error('provider failure');
        },
      }),
    ),
    (error) => error instanceof ErrorUbicacion && error.codigo === 'captura_fallida',
  );
});
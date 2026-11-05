const assert = require('node:assert/strict');
const fs = require('node:fs');
const { beforeEach, afterEach, test } = require('node:test');
const ts = require('typescript');

process.env.EXPO_PUBLIC_API_URL = 'https://mockapi.example.invalid';

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

const {
  buscarLecturaRemotaPorClave,
  coincideUbicacionRemota,
  crearLecturaRemota,
} = require('../src/api/lecturasApi.ts');

const ubicacionGps = {
  latitud: -0.2,
  longitud: -78.5,
  origenUbicacion: 'gps',
  precisionGps: 8,
};

const lectura = {
  claveUnica: 'MED-123456_2026-11',
  medidorCodigo: 'MED-123456',
  periodo: '2026-11',
  estadoMedidor: 'normal',
  lectura: 101,
  lecturaAnterior: 100,
  consumo: 1,
  promedioMensual: 2,
  consumoAnomalo: false,
  confirmacionAnomalia: false,
  motivo: null,
  descripcion: null,
  fotoNombre: null,
  ubicacion: ubicacionGps,
  verificacion: 'verificada',
  tecnicoCodigo: null,
  creadoEn: '2026-11-05T12:00:00.000Z',
};

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://mockapi.example.invalid';
});

test('el POST existente serializa los cuatro campos de ubicación', async () => {
  let payload;
  global.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return Response.json({ id: 'remote-1', ...payload });
  };

  const remota = await crearLecturaRemota(lectura);
  assert.equal(payload.latitud, ubicacionGps.latitud);
  assert.equal(payload.longitud, ubicacionGps.longitud);
  assert.equal(payload.origenUbicacion, 'gps');
  assert.equal(payload.precisionGps, 8);
  assert.deepEqual(remota.ubicacion, ubicacionGps);
});

test('el cliente no acepta que MockAPI descarte la ubicación al crear', async () => {
  global.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    delete payload.latitud;
    delete payload.longitud;
    delete payload.origenUbicacion;
    delete payload.precisionGps;
    return Response.json({ id: 'remote-2', ...payload });
  };

  await assert.rejects(crearLecturaRemota(lectura), /no conservó correctamente la ubicación/);
});

test('las lecturas remotas históricas sin campos GPS se mantienen sin ubicación', async () => {
  global.fetch = async () =>
    Response.json([
      {
        id: 'remote-old',
        claveUnica: 'MED-123456_2025-01',
        medidorCodigo: 'MED-123456',
        periodo: '2025-01',
      },
    ]);

  const remote = await buscarLecturaRemotaPorClave('MED-123456_2025-01');
  assert.equal(remote.ubicacion, null);
});

test('reintento remoto compara ubicación GPS o manual antes de aceptar duplicado', () => {
  assert.equal(coincideUbicacionRemota({ ubicacion: ubicacionGps }, { ubicacion: ubicacionGps }), true);
  assert.equal(
    coincideUbicacionRemota(
      { ubicacion: ubicacionGps },
      { ubicacion: { ...ubicacionGps, longitud: -78.51 } },
    ),
    false,
  );
  assert.equal(coincideUbicacionRemota({ ubicacion: null }, { ubicacion: null }), true);
});
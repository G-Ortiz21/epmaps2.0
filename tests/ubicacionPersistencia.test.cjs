const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');
const ts = require('typescript');

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

const database = new DatabaseSync(':memory:');
const adapter = {
  async getFirstAsync(sql, params = []) {
    return database.prepare(sql).get(...params) ?? null;
  },
  async getAllAsync(sql, params = []) {
    return database.prepare(sql).all(...params);
  },
  async runAsync(sql, params = []) {
    const result = database.prepare(sql).run(...params);
    return { changes: Number(result.changes) };
  },
  async execAsync(sql) {
    database.exec(sql);
  },
  async withTransactionAsync(callback) {
    database.exec('BEGIN');
    try {
      await callback();
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  },
};

const load = Module._load;
Module._load = function (request, parent, isMain) {
  if (
    request === '../database' &&
    parent?.filename.endsWith(`${require('node:path').sep}data${require('node:path').sep}repositories${require('node:path').sep}lecturasRepository.ts`)
  ) {
    return { getDatabase: async () => adapter };
  }
  if (
    request === '../database' &&
    parent?.filename.endsWith(`${require('node:path').sep}data${require('node:path').sep}repositories${require('node:path').sep}borradorRepository.ts`)
  ) {
    return { getDatabase: async () => adapter };
  }
  return load.call(this, request, parent, isMain);
};

const { MIGRATIONS, ejecutarMigraciones } = require('../src/data/migrations.ts');
const {
  crearLecturaLocal,
  obtenerTodasLasLecturas,
} = require('../src/data/repositories/lecturasRepository.ts');
const { obtenerBorrador } = require('../src/data/repositories/borradorRepository.ts');

test('migración v1 a v2 conserva lecturas y borradores legacy sin ubicación', async () => {
  database.exec(MIGRATIONS[0].sql);
  database.exec('PRAGMA user_version = 1');
  database.prepare(`
    INSERT INTO lecturas (
      clave_unica, medidor_codigo, periodo, estado_medidor, verificacion,
      sync_estado, creado_en, actualizado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'MED-123456_2026-10',
    'MED-123456',
    '2026-10',
    'normal',
    'verificada',
    'enviada',
    '2026-10-10T12:00:00.000Z',
    '2026-10-10T12:00:00.000Z',
  );
  database.prepare(`
    INSERT INTO borrador (id, codigo_medidor, estado_medidor, paso, datos_json, actualizado_en)
    VALUES (1, ?, ?, ?, ?, ?)
  `).run(
    'MED-654321',
    'normal',
    'fotografia',
    JSON.stringify({ lectura: '45' }),
    '2026-10-10T12:00:00.000Z',
  );

  await ejecutarMigraciones(adapter);

  const vieja = (await obtenerTodasLasLecturas())[0];
  assert.equal(vieja.claveUnica, 'MED-123456_2026-10');
  assert.equal(vieja.ubicacion, null);
  assert.deepEqual((await obtenerBorrador()).datos, { lectura: '45' });
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 2);
});

test('nueva lectura GPS y manual se guardan en la tabla existente', async () => {
  const base = {
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
    verificacion: 'verificada',
    tecnicoCodigo: 'TEC-001',
  };

  const gps = await crearLecturaLocal({
    ...base,
    medidorCodigo: 'MED-222222',
    ubicacion: {
      latitud: -0.2,
      longitud: -78.5,
      origenUbicacion: 'gps',
      precisionGps: 8,
    },
  }, new Date(2026, 10, 5));
  assert.deepEqual(gps.ubicacion, {
    latitud: -0.2,
    longitud: -78.5,
    origenUbicacion: 'gps',
    precisionGps: 8,
  });

  const manual = await crearLecturaLocal({
    ...base,
    medidorCodigo: 'MED-333333',
    ubicacion: {
      latitud: -0.21,
      longitud: -78.51,
      origenUbicacion: 'manual',
      precisionGps: null,
    },
  }, new Date(2026, 10, 6));
  assert.equal(manual.ubicacion.origenUbicacion, 'manual');
  assert.equal(manual.ubicacion.precisionGps, null);
});

test('el repositorio rechaza crear una lectura sin ubicación válida', async () => {
  await assert.rejects(
    crearLecturaLocal({
      medidorCodigo: 'MED-444444',
      estadoMedidor: 'normal',
      lectura: 12,
      lecturaAnterior: null,
      consumo: null,
      promedioMensual: null,
      consumoAnomalo: null,
      confirmacionAnomalia: false,
      motivo: null,
      descripcion: null,
      fotoNombre: null,
      verificacion: 'pendiente_verificar',
      tecnicoCodigo: null,
      ubicacion: null,
    }),
    /ubicación válida/,
  );
});

test('animaciones Lottie son JSON locales no vacíos', () => {
  for (const nombre of ['lectura-exitosa.json', 'radar-ubicacion.json']) {
    const animation = JSON.parse(
      fs.readFileSync(`src/assets/animations/${nombre}`, 'utf8'),
    );
    assert.ok(animation.layers.length > 0);
    assert.ok(animation.op > animation.ip);
  }
});
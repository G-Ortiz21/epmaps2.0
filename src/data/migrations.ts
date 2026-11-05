import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  sql: string;
}

// v1 maps MedidorCache.datos to JSON, LecturaLocal to its explicit reading
// columns, and BorradorRegistro.datos to JSON with a separately stored route step.
export const CURRENT_SCHEMA_VERSION = 1;

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS medidores_cache (
        codigo TEXT PRIMARY KEY NOT NULL,
        datos_json TEXT NOT NULL,
        consultado_en TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lecturas (
        clave_unica TEXT PRIMARY KEY NOT NULL,
        remote_id TEXT,
        medidor_codigo TEXT NOT NULL,
        periodo TEXT NOT NULL
          CHECK (
            length(periodo) = 7
            AND substr(periodo, 5, 1) = '-'
            AND substr(periodo, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
            AND substr(periodo, 6, 2) BETWEEN '01' AND '12'
          ),
        estado_medidor TEXT NOT NULL
          CHECK (estado_medidor IN ('normal', 'inaccesible', 'danado')),
        lectura INTEGER
          CHECK (lectura IS NULL OR (lectura >= 0 AND lectura = CAST(lectura AS INTEGER))),
        lectura_anterior INTEGER
          CHECK (
            lectura_anterior IS NULL
            OR (lectura_anterior >= 0 AND lectura_anterior = CAST(lectura_anterior AS INTEGER))
          ),
        consumo INTEGER
          CHECK (consumo IS NULL OR (consumo >= 0 AND consumo = CAST(consumo AS INTEGER))),
        promedio_mensual REAL
          CHECK (promedio_mensual IS NULL OR promedio_mensual >= 0),
        consumo_anomalo INTEGER
          CHECK (consumo_anomalo IS NULL OR consumo_anomalo IN (0, 1)),
        confirmacion_anomalia INTEGER NOT NULL DEFAULT 0
          CHECK (confirmacion_anomalia IN (0, 1)),
        motivo TEXT,
        descripcion TEXT,
        foto_nombre TEXT,
        verificacion TEXT NOT NULL
          CHECK (verificacion IN ('verificada', 'pendiente_verificar', 'requiere_accion')),
        sync_estado TEXT NOT NULL DEFAULT 'pendiente'
          CHECK (sync_estado IN ('pendiente', 'enviando', 'enviada', 'error')),
        tecnico_codigo TEXT,
        creado_en TEXT NOT NULL,
        actualizado_en TEXT NOT NULL,
        intentos_sync INTEGER NOT NULL DEFAULT 0
          CHECK (intentos_sync >= 0),
        ultimo_error TEXT,
        CHECK (clave_unica = medidor_codigo || '_' || periodo),
        CONSTRAINT lecturas_medidor_periodo_unico UNIQUE (medidor_codigo, periodo)
      );

      CREATE INDEX IF NOT EXISTS idx_lecturas_sync_creado
        ON lecturas(sync_estado, creado_en);
      CREATE INDEX IF NOT EXISTS idx_lecturas_verificacion_sync
        ON lecturas(verificacion, sync_estado);

      CREATE TABLE IF NOT EXISTS borrador (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        codigo_medidor TEXT,
        estado_medidor TEXT
          CHECK (
            estado_medidor IS NULL
            OR estado_medidor IN ('normal', 'inaccesible', 'danado')
          ),
        paso TEXT NOT NULL
          CHECK (
            paso IN (
              'estado_medidor',
              'datos_lectura',
              'revision_consumo',
              'fotografia',
              'resumen'
            )
          ),
        datos_json TEXT NOT NULL,
        actualizado_en TEXT NOT NULL
      );
    `,
  },
];

export async function ejecutarMigraciones(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const installedVersion = versionRow?.user_version ?? 0;

  if (
    !Number.isInteger(installedVersion) ||
    installedVersion < 0 ||
    installedVersion > CURRENT_SCHEMA_VERSION
  ) {
    throw new Error(
      `Versión SQLite no compatible: ${installedVersion}. ` +
        `La aplicación admite hasta ${CURRENT_SCHEMA_VERSION}.`,
    );
  }

  const pendingMigrations = MIGRATIONS.filter(
    (migration) => migration.version > installedVersion,
  );
  if (pendingMigrations.length === 0) {
    return;
  }

  await database.withTransactionAsync(async () => {
    for (const migration of pendingMigrations) {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    }
  });
}
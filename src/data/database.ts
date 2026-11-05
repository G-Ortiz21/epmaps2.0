import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { ejecutarMigraciones } from './migrations';

const DATABASE_NAME = 'lectura_agil.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLiteDatabase> {
  if (databasePromise === null) {
    const opening = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await ejecutarMigraciones(database);
      return database;
    });

    databasePromise = opening.catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}
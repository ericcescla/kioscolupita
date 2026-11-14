import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sequelize } from '../config/database';

const migration = process.argv[2] === 'undo' ? '001-create-productos.down.sql' : '001-create-productos.sql';
const filePath = resolve(__dirname, '../../migrations', migration);

async function run(): Promise<void> {
  try {
    await sequelize.authenticate();
    const sql = await readFile(filePath, 'utf8');
    await sequelize.transaction(async (transaction) => { await sequelize.query(sql, { transaction }); });
    console.info(migration.endsWith('.down.sql') ? 'Se eliminó la tabla productos.' : 'Migración aplicada: tabla productos creada.');
  } finally {
    await sequelize.close();
  }
}

run().catch((error: unknown) => {
  console.error('No se pudo ejecutar la migración. Revisá DATABASE_URL y que PostgreSQL esté disponible.', error);
  process.exitCode = 1;
});

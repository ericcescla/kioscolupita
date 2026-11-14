import "dotenv/config";
import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "Falta DATABASE_URL. Copiá backend/.env.example a backend/.env y configurá la conexión.",
  );
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging:
    process.env.NODE_ENV === "development"
      ? (sql) => console.info(`[db] ${sql}`)
      : false,
  dialectOptions:
    process.env.DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});

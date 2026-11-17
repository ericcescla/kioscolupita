import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { sequelize } from "./config/database";
import { productoRoutes } from "./routes/productoRoutes";

const app = express();
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = process.env.NODE_ENV === "production"
  ? configuredOrigins
  : [...new Set(["http://localhost:5173", ...configuredOrigins])];

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});
app.use("/api/productos", productoRoutes);
app.use((_req, res) => {
  res.status(404).json({ error: "Recurso no encontrado." });
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res
    .status(500)
    .json({
      error:
        "Ocurrió un error interno. Revisá la conexión con la base de datos.",
    });
});

const port = Number(process.env.PORT || 4000);
async function start(): Promise<void> {
  await sequelize.authenticate();
  app.listen(port, () =>
    console.info(`Kiosco Lupita API disponible en http://localhost:${port}`),
  );
}
start().catch((error: unknown) => {
  console.error(
    "No se pudo iniciar la API. Revisá DATABASE_URL y que PostgreSQL esté disponible.",
    error,
  );
  process.exit(1);
});

import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { config } from "./config";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import feriasRoutes from "./routes/ferias";
import notificationsRoutes from "./routes/notifications";
import feriasDashboardRoutes from "./routes/feriasDashboard";

const app = express();
const staticDir = path.resolve(__dirname, "..", "..", "frontend");
app.use(express.static(staticDir));
app.use(
  cors({
    origin: ["http://localhost:3000", config.corsOrigin].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/ferias", feriasRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/api/ferias", feriasDashboardRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => console.log(`API rodando em http://localhost:${port}`));

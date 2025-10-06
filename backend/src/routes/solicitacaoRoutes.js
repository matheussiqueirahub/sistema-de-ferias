import express from "express";
import { aprovarFerias, solicitarFerias, rejeitarFerias } from "../controllers/solicitacaoController";

const router = express.Router();

// 🔹 Listar solicitações
router.get("/soli/ferias", async (req, res) => {
  try {
    const periodos = await prisma.periodos.findMany({
      include: { funcionarios: true }
    });
    res.json(periodos);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar férias" });
  }
});

// 🔹 Solicitar férias
router.post("/soli/ferias", solicitarFerias);

// 🔹 Aprovar férias
router.post("/aprove/solicitacao/:id", aprovarFerias);

// 🔹 Rejeitar férias
router.post("/reje/sol/:id", rejeitarFerias);

export default router;

import { Router } from "express";
import {
  getTotalFuncionarios,
  getFeriasMesAtual,
  getFeriasAgendadas,
  getFeriasSolicitadas,
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/funcionarios/count", getTotalFuncionarios);
router.get("/ferias/mes-atual", getFeriasMesAtual);
router.get("/ferias/agendadas", getFeriasAgendadas);
router.get("/ferias/solicitacoes", getFeriasSolicitadas);

export default router;

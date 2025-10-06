// backsist/routes/feriasRoutes.js
import express from 'express';
import { getPeriodosValidos, criarSolicitacaoFerias } from '../controllers/feriasController.js';

const router = express.Router();

router.get('/periodos/:matricula', getPeriodosValidos);
router.post('/solicitacao', criarSolicitacaoFerias);

export default router;

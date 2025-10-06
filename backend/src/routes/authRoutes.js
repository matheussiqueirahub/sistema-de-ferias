import express from 'express'; // Correto: express é um export default
import { login, alterarSenha } from '../controllers/authController.js'; // Correto: adiciona .js e importa de forma nomeada

const router = express.Router();

router.post('/login', login);
router.post('/nova-senha', alterarSenha);

export default router; // Correto: exporta o router como default
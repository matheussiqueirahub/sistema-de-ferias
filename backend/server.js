import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { getGerencias, getTodosFuncionarios } from './src/controllers/gerenciaController.js';
import feriasRoutes from './src/routes/feriasRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import gerenciaRoutes from './src/routes/gerenciaRoutes.js';
import authRoutes from './src/routes/authRoutes.js';

const prisma = new PrismaClient();
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Rotas principais

app.use('/solicitar-ferias', feriasRoutes);
app.use('/tela', dashboardRoutes);
app.use('/gerencias', gerenciaRoutes);
app.use('/', authRoutes); // garante que /nova-senha existe

// ------------------------
// ROTA DE LOGIN
// ------------------------
app.post('/login', async (req, res) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const user = await prisma.cadastro.findUnique({
      where: { MATRICULA: String(matricula) },
    });

    if (!user || !user.SENHA) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.SENHA);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const isSenhaPadrao = senha === String(matricula);

    // Oculta a senha no retorno
    const { senha: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      user: userWithoutPassword,
      senhaPadrao: isSenhaPadrao,
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro no login. Tente novamente mais tarde.' });
  }
});

// ------------------------
// ROTA DE CADASTRO
// ------------------------
app.post('/register', async (req, res) => {
  const { matricula, senha, nome, email, id_gerencia } = req.body;

  if (!matricula || !senha || !nome || !email || !id_gerencia) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const existingUser = await prisma.cadastro.findUnique({
      where: { MATRICULA: String(matricula) },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Matrícula já cadastrada.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const newUser = await prisma.cadastro.create({
      data: {
        MATRICULA: String(matricula),
        SENHA: hashedPassword,
        NOME: String(nome),
        EMAIL: String(email),
        ID_GERENCIA: Number(id_gerencia),
        DATA_CRIACAO: new Date(),
      },
    });

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso.',
      user: {
        MATRICULA: newUser.MATRICULA,
        NOME: newUser.NOME,
      },
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ------------------------
// INICIALIZAÇÃO DO SERVIDOR
// ------------------------
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

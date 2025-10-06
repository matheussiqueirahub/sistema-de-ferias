import bcrypt from 'bcrypt';
import prisma from '../prismaClient.js';

// Login (com export nomeado)
export const login = async (req, res) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({ error: "Preencha todos os campos." });
  }

  try {
    const user = await prisma.cadastro.findUnique({
      where: { MATRICULA: matricula },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.SENHA);
    if (!senhaCorreta) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      nome: user.NOME,
      tipo: user.ID_TIPO_USER,
      matricula: user.MATRICULA,
      primeiro_acesso: user.primeiro_acesso
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Alterar senha (com export nomeado)
export const alterarSenha = async (req, res) => {
  const { matricula, novaSenha } = req.body;

  if (!matricula || !novaSenha) {
    return res.status(400).json({ error: "Matrícula e nova senha são obrigatórias." });
  }

  console.log('Tentando alterar a senha para a matrícula:', matricula);
  console.log('Nova senha recebida (sem hash):', novaSenha);

  try {
    const hashedSenha = await bcrypt.hash(novaSenha, 10);
    console.log('Senha com hash:', hashedSenha);

    const userUpdated = await prisma.cadastro.update({
      where: { MATRICULA: matricula },
      data: {
        SENHA: hashedSenha,
        primeiro_acesso: true
      }
    });

    if (!userUpdated) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    console.log('Senha atualizada com sucesso para o usuário:', userUpdated.MATRICULA);
    return res.status(200).json({ message: "Senha atualizada com sucesso." });

  } catch (error) {
    console.error("Erro ao atualizar a senha:", error);
    return res.status(500).json({ error: "Erro ao atualizar a senha. Verifique se a matrícula existe." });
  }
};
import prisma from "../prismaClient.js";

// 🔹 Mapeamento de status
const STATUS = {
  EM_ABERTO: 2,
  EM_GOZO: 3,
  GOZADO: 4,
  SOLICITADO: 5,
};

// 🔹 Solicitar férias
export const solicitarFerias = async (req, res) => {
  const { matricula, periodo, inicio, fim } = req.body;

  try {
    const funcionario = await prisma.funcionarios.findUnique({
      where: { MATRICULA_F: matricula },
      include: { cargos_funcionarios: true },
    });

    if (!funcionario) {
      return res.status(404).json({ error: "Funcionário não encontrado." });
    }

    // Cria a solicitação já com status SOLICITADO (5)
    const solicitacao = await prisma.periodos.create({
      data: {
        MATRICULA_SEM_PONTO: matricula,
        PERIODO_AQUISITIVO_EM_ABERTO: periodo,
        TIPO: 1, // Exemplo de tipo, ajuste se necessário
        STATUS: STATUS.SOLICITADO,
      },
    });

    const isGerente = funcionario.cargos_funcionarios.some(
      (c) => c.COD_CARGO === '20157'
    );
    
    // A lógica de aprovação do gerente deve estar na rota de aprovação
    // Se a aprovação do gerente já cria o gozo, a lógica aqui é redundante
    // Mantenha apenas a criação da solicitação
    
    res.json(solicitacao);

  } catch (error) {
    console.error("Erro ao solicitar férias:", error);
    res.status(500).json({ error: "Erro ao solicitar férias." });
  }
};

// 🔹 Aprovar férias
export const aprovarFerias = async (req, res) => {
  const { id } = req.params;
  const { matricula } = req.user;

  try {
    const periodo = await prisma.periodos.findUnique({
      where: { ID: parseInt(id) },
      include: { funcionarios: { include: { cargos_funcionarios: true } } },
    });

    if (!periodo) return res.status(404).json({ error: "Solicitação não encontrada." });

    const usuario = await prisma.funcionarios.findUnique({
      where: { MATRICULA_F: matricula },
      include: { cargos_funcionarios: true },
    });

    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    const isGerente = usuario.cargos_funcionarios.some((c) => c.COD_CARGO === '20157');
    const isSecretaria = usuario.cargos_funcionarios.some((c) => c.COD_CARGO === '20121');

    if (isGerente) {
      // Verifica se o gerente pertence à mesma gerência do funcionário
      // OBS: a sua tabela funcionarios não tem o campo ID_GERENCIA. Use SIGLA_GERENCIA.
      // E a sua tabela de cadastro tem ID_GERENCIA. Precisamos ajustar essa verificação.
      // Supondo que você use a SIGLA_GERENCIA para a verificação:
      if (usuario.SIGLA_GERENCIA !== periodo.funcionarios.SIGLA_GERENCIA) {
        return res.status(403).json({ error: "Você não pode aprovar essa solicitação." });
      }

      await prisma.periodos.update({
        where: { ID: periodo.ID },
        data: { STATUS: STATUS.EM_ABERTO }, // gerente aprovou → em aberto (2)
      });

      return res.json({ message: "Solicitação aprovada pelo gerente. Encaminhada para a secretária executiva." });
    }

    if (isSecretaria) {
      const { inicio, fim, saldo } = req.body; // Adicione essas variáveis ao corpo da requisição de aprovação.

      // Cria um novo registro em ferias_gozo e o conecta ao período correto
      await prisma.ferias_gozo.create({
        data: {
          ID: periodo.ID,
          MES_INICIO: new Date(inicio),
          MES_FIM: new Date(fim),
          SALDO: saldo,
          TIPO: 'normal', // Exemplo de tipo, ajuste conforme necessário
          PERCEPCAO: 'percepcao', // Exemplo de percepção, ajuste conforme necessário
          ANO: new Date().getFullYear().toString(),
          periodos: {
            connect: {
                ID: periodo.ID
            }
          }
        },
      });

      // Atualiza o status do período para "Em Gozo"
      await prisma.periodos.update({
        where: { ID: periodo.ID },
        data: { STATUS: STATUS.EM_GOZO },
      });

      return res.json({ message: "Solicitação confirmada pela secretária executiva. Férias registradas." });
    }

    res.status(403).json({ error: "Você não tem permissão para aprovar férias." });
  } catch (error) {
    console.error("Erro ao aprovar férias:", error);
    res.status(500).json({ error: "Erro ao aprovar férias." });
  }
};

// 🔹 Rejeitar férias
export const rejeitarFerias = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.periodos.update({
      where: { ID: parseInt(id) },
      data: { STATUS: STATUS.SOLICITADO }, // volta para solicitado (5)
    });

    res.json({ message: "Solicitação rejeitada verbalmente. Status segue em aberto." });
  } catch (error) {
    console.error("Erro ao rejeitar férias:", error);
    res.status(500).json({ error: "Erro ao rejeitar férias." });
  }
};

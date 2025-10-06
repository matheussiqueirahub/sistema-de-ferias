import prisma from "../prismaClient.js";


export const getPeriodosValidos = async (req, res) => {
  try {
    const periodos = await prisma.periodos.findMany({
      where: {
        MATRICULA_SEM_PONTO: req.params.matricula,
        status_ferias: {
          ID_STATUS: 2, // "Em aberto"
        },
      },
    });

    res.json(periodos); // 🔹 agora só retorna períodos em aberto
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
};

// Cria uma nova solicitação de férias
export const criarSolicitacaoFerias = async (req, res) => {
  const { matricula, periodo, dataInicio, dataFim, ano } = req.body;

  try {
    // Verifica se o funcionário existe
    const funcionario = await prisma.funcionarios.findUnique({
      where: { MATRICULA_F: matricula },
    });
    if (!funcionario) return res.status(404).json({ message: "Funcionário não encontrado." });

    // Busca período aquisitivo em aberto (ID_STATUS = 2)
    const periodoValido = await prisma.periodos.findFirst({
      where: {
        MATRICULA_SEM_PONTO: matricula,
        PERIODO_AQUISITIVO_EM_ABERTO: periodo,
        STATUS: 2 // campo Int do período que indica "Em aberto"
      },
    });

    if (!periodoValido)
      return res.status(400).json({ message: "Nenhum período aquisitivo válido encontrado." });

    // Cria solicitação de férias
    const dias = Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const novaSolicitacao = await prisma.periodos.create({
      data: {
        MATRICULA: matricula,
        PERIODO_AQUISITIVO: periodo,
        DIAS_SOL: dias,
        TIPO: 1, // ou pegar do req.body
        STATUS: 5, // "Solicitado"
        MES: String(new Date(dataInicio).getMonth() + 1),
        ANO: ano,
      },
    });

    // Atualiza período para "Solicitado" (ID_STATUS = 5)
    await prisma.periodos.update({
      where: {
        MATRICULA_SEM_PONTO_PERIODO_AQUISITIVO_EM_ABERTO: {
          MATRICULA_SEM_PONTO: matricula,
          PERIODO_AQUISITIVO_EM_ABERTO: periodo,
        },
      },
      data: {
        STATUS: 5,
      },
    });

    res.status(201).json({ message: "Solicitação criada com sucesso.", novaSolicitacao });
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
    res.status(500).json({ message: "Erro interno ao criar solicitação." });
  }
};

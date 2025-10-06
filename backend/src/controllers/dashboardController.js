import prisma from '../prismaClient.js'; // ESModules
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Total de funcionários
export const getTotalFuncionarios = async (req, res) => {
  try {
    const total = await prisma.funcionarios.count();
    res.json({ total });
  } catch (error) {
    console.error("Erro ao buscar total de funcionários:", error);
    res.status(500).json({ error: 'Erro ao buscar total de funcionários' });
  }
};

// Férias no mês atual
export const getFeriasMesAtual = async (req, res) => {
  try {
    const inicioMes = startOfMonth(new Date());
    const fimMes = endOfMonth(new Date());

    const total = await prisma.ferias_gozo.count({
      where: {
        MES_INICIO: {
          gte: inicioMes,
          lte: fimMes
        }
      }
    });

    res.json({ total });
  } catch (error) {
    console.error("Erro ao buscar férias do mês atual:", error);
    res.status(500).json({ error: 'Erro ao buscar férias do mês atual' });
  }
};

// Funcionários com férias
export const getFuncionariosComFerias = async (req, res) => {
  try {
    const funcionarios = await prisma.funcionarios.findMany({
      include: {
        periodos: {
          include: {
            ferias_gozo: true
          }
        }
      }
    });

    const resposta = funcionarios.map(f => {
      const ferias = f.periodos?.flatMap(p => p.ferias_gozo)[0]; // primeira férias
      return {
        MATRICULA_F: f.MATRICULA_F,
        NOME: f.NOME,
        GERENCIA: f.GERENCIA,
        SIGLA_GERENCIA: f.SIGLA_GERENCIA,
        PERIODO_AQUISITIVO_EM_ABERTO: f.periodos?.[0]?.PERIODO_AQUISITIVO_EM_ABERTO || null,
        MES_FORMATADO: ferias?.MES_INICIO
          ? format(new Date(ferias.MES_INICIO), "MMMM", { locale: ptBR }).toLowerCase()
          : null,
        SALDO: ferias?.SALDO || null
      };
    });

    res.json(resposta);
  } catch (error) {
    console.error("Erro ao buscar funcionários com férias:", error);
    res.status(500).json({ error: "Erro ao buscar funcionários" });
  }
};

// Férias agendadas
export const getFeriasAgendadas = async (req, res) => {
  try {
    const total = await prisma.periodos.count({
      where: {
        PERIODO_AQUISITIVO_EM_ABERTO: "a completar"
      }
    });

    res.json({ total });
  } catch (error) {
    console.error("Erro ao buscar férias agendadas:", error);
    res.status(500).json({ error: 'Erro ao buscar férias agendadas' });
  }
};

// Solicitações de férias em aberto
export const getFeriasSolicitadas = async (req, res) => {
  const statusEmAberto = 2; // conforme seu mapeamento

  try {
    const total = await prisma.periodos.count({
      where: {
        STATUS: statusEmAberto,
      },
    });

    res.status(200).json({ total });
  } catch (error) {
    console.error('Erro ao buscar solicitações de férias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

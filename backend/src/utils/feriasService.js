import prisma from '../prismaClient.js';
import { addDays, format, getYear } from 'date-fns';

export const gerarPeriodosAquisitivos = async () => {
  try {
    const funcionarios = await prisma.funcionarios.findMany({
      select: {
        MATRICULA_F: true,
        DATA_ADMISSAO: true,
      },
    });

    for (const funcionario of funcionarios) {
      if (funcionario.DATA_ADMISSAO) {
        let dataAdmissao = new Date(funcionario.DATA_ADMISSAO);
        let anoInicial = getYear(dataAdmissao);
        let dataAquisitivaFim = addDays(dataAdmissao, 365);
        let anoFinal = getYear(dataAquisitivaFim);

        // Formata o período aquisitivo como "YYYY/YYYY"
        let periodoAquisitivo = `${anoInicial}/${anoFinal}`;

        // Verifica se o período já existe para este funcionário
        const periodoExistente = await prisma.periodos.findUnique({
          where: {
            MATRICULA_SEM_PONTO_PERIODO_AQUISITIVO_EM_ABERTO: {
              MATRICULA_SEM_PONTO: funcionario.MATRICULA_F,
              PERIODO_AQUISITIVO_EM_ABERTO: periodoAquisitivo,
            },
          },
        });

        // Se o período aquisitivo não existir, cria um novo
        if (!periodoExistente) {
          await prisma.periodos.create({
            data: {
              MATRICULA_SEM_PONTO: funcionario.MATRICULA_F,
              PERIODO_AQUISITIVO_EM_ABERTO: periodoAquisitivo,
              // Você pode adicionar um saldo inicial de dias aqui, se necessário
              // SALDO: 30,
            },
          });
          console.log(`Período aquisitivo criado para a matrícula ${funcionario.MATRICULA_F}: ${periodoAquisitivo}`);
        } else {
          console.log(`Período aquisitivo ${periodoAquisitivo} já existe para a matrícula ${funcionario.MATRICULA_F}`);
        }
      }
    }
    return { success: true, message: 'Períodos aquisitivos gerados com sucesso.' };
  } catch (error) {
    console.error('Erro ao gerar períodos aquisitivos:', error);
    return { success: false, message: 'Erro ao gerar períodos aquisitivos.' };
  }
};
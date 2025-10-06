import prisma from '../prismaClient.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addDays, getYear } from 'date-fns';

// GET: /gerencias
export const getGerencias = async (req, res) => {
  try {
    const gerencias = await prisma.gerencia.findMany();
    res.json(gerencias);
  } catch (err) {
    console.error('Erro ao buscar gerências:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
// GET: /funcionarios (todos) - AGORA INCLUI ferias_gozo
export const getTodosFuncionarios = async (req, res) => {
  try {
    const funcionarios = await prisma.funcionarios.findMany({
      include: {
        periodos: {
          orderBy: { PERIODO_AQUISITIVO_EM_ABERTO: 'desc' },
          take: 1,
          select: {
            PERIODO_AQUISITIVO_EM_ABERTO: true,
            ID: true,
            ferias_gozo: true, // <--- ADICIONADO: Inclui os dados de gozo de férias
          },
        },
        gerencia: {
          select: { GERENCIA: true, SIGLA_GERENCIA: true },
        },
      },
    });

    const resultado = funcionarios.map(f => ({
      MATRICULA_F: f.MATRICULA_F,
      NOME: f.NOME,
      SIGLA_GERENCIA: f.gerencia?.SIGLA_GERENCIA || '---',
      PERIODO_AQUISITIVO_EM_ABERTO: f.periodos[0]?.PERIODO_AQUISITIVO_EM_ABERTO || '---',
      ID_PERIODO: f.periodos[0]?.ID || null,
      // Você pode adicionar mais campos aqui se precisar de mais dados do gozo
      // ou deixar que o frontend faça o mapeamento completo com a função mapAndFormatFuncionarios
      ferias_gozo: f.periodos[0]?.ferias_gozo || null, // Passa o objeto ferias_gozo aninhado
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionários.' });
  }
};
// GET /gerencias/:sigla/funcionarios
export const getFuncionariosComFerias = async (req, res) => {
  const { sigla } = req.params;
  const { nome } = req.query; // <-- pegando nome da query

  try {
    const funcionarios = await prisma.funcionarios.findMany({
      where: nome ? {
        SIGLA_GERENCIA: sigla,
        NOME: {
          contains: nome,
          mode: 'insensitive'
        },
      }
        :
        {

          SIGLA_GERENCIA: sigla,

        },
      include: {
        periodos: {
          include: {
            ferias_gozo: true
          }
        },
        gerencia: true,
      }
    });

    const resposta = funcionarios.map(f => {
      const ferias = f.periodos?.flatMap(p => p.ferias_gozo)?.[0] || null;

      return {
        MATRICULA_F: f.MATRICULA_F,
        NOME: f.NOME,
        SIGLA_GERENCIA: f.SIGLA_GERENCIA,
        PERIODO_AQUISITIVO_EM_ABERTO:
          f.periodos?.[0]?.PERIODO_AQUISITIVO_EM_ABERTO || null,
        ID_PERIODO: ferias?.ID || null,
        MES_INICIO: ferias?.MES_INICIO,
        MES_FIM: ferias?.MES_FIM
          ? format(new Date(ferias.MES), "MMMM", { locale: ptBR }).toLowerCase()
          : null,

        SALDO: ferias?.SALDO || null,
        ferias_gozo: ferias || null, // Adicionado para consistência com getTodosFuncionarios
      };
    });

    res.json(resposta);
  } catch (error) {
    console.error("Erro ao buscar funcionários com férias por gerência:", error);
    res.status(500).json({ error: "Erro ao buscar funcionários com férias por gerência." });
  }
};
// GET: /ferias
export const getFuncionariosEmFerias = async (req, res) => {
  const currentYear = new Date().getFullYear().toString();

  try {
    let gozoFerias = await prisma.ferias_gozo.findMany({
      where: { ANO: currentYear },
      orderBy: { MES_INICIO: 'asc' }, // <--- CORRIGIDO: Usa MES_INICIO para ordenação
      select: {
        ID: true,
        MES_INICIO: true, // <--- CORRIGIDO: Seleciona MES_INICIO
        MES_FIM: true,    // <--- ADICIONADO: Seleciona MES_FIM (se relevante para o retorno)
        ANO: true,
        TIPO: true,
        SALDO: true,
        PERCEPCAO: true,
        periodos: {
          select: {
            PERIODO_AQUISITIVO_EM_ABERTO: true,
            funcionarios: {
              select: {
                MATRICULA_F: true,
                NOME: true,
                SIGLA_GERENCIA: true,
              }
            }
          }
        }
      }
    });

    if (gozoFerias.length === 0) {
      gozoFerias = await prisma.ferias_gozo.findMany({
        where: { ANO: (parseInt(currentYear) + 1).toString() },
        orderBy: { MES_INICIO: 'asc' }, // <--- CORRIGIDO: Usa MES_INICIO para ordenação
        select: {
          ID: true, // Certifique-se de que o ID está sendo selecionado aqui também
          MES_INICIO: true, // <--- CORRIGIDO: Seleciona MES_INICIO
          MES_FIM: true,    // <--- ADICIONADO: Seleciona MES_FIM (se relevante para o retorno)
          ANO: true,
          TIPO: true,
          SALDO: true,
          PERCEPCAO: true, // Certifique-se de que PERCEPCAO está sendo selecionada aqui também
          periodos: {
            select: {
              PERIODO_AQUISITIVO_EM_ABERTO: true,
              funcionarios: {
                select: {
                  MATRICULA_F: true,
                  NOME: true,
                  SIGLA_GERENCIA: true,
                },
              },
            },
          },
        },
      });
    }

    // Ajusta o retorno para o frontend ficar mais simples
    const formatted = gozoFerias.map(feria => {
      const periodo = feria.periodos[0];
      const funcionario = periodo?.funcionarios;

      return {
        ID: feria.ID,
        MES_INICIO: feria.MES_INICIO, // <--- CORRIGIDO: Usa MES_INICIO no retorno
        MES_FIM: feria.MES_FIM,      // <--- ADICIONADO: Usa MES_FIM no retorno
        TIPO: feria.TIPO,
        PERCEPCAO: feria.PERCEPCAO,
        ANO: feria.ANO,
        SALDO: feria.SALDO,
        MATRICULA_F: funcionario?.MATRICULA_F || null,
        NOME: funcionario?.NOME || null,
        SIGLA_GERENCIA: funcionario?.SIGLA_GERENCIA || null,
        PERIODO_AQUISITIVO_EM_ABERTO: periodo?.PERIODO_AQUISITIVO_EM_ABERTO || null,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao buscar gozo:', error);
    res.status(500).json({ error: 'Erro ao buscar gozo.' });
  }
};
export const gerarPeriodosAquisitivos = async (req, res) => {
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

        let periodoAquisitivo = `${anoInicial}/${anoFinal}`;

        const periodoExistente = await prisma.periodos.findUnique({
          where: {
            MATRICULA_SEM_PONTO_PERIODO_AQUISITIVO_EM_ABERTO: {
              MATRICULA_SEM_PONTO: funcionario.MATRICULA_F,
              PERIODO_AQUISITIVO_EM_ABERTO: periodoAquisitivo,
            },
          },
        });

        if (!periodoExistente) {
          await prisma.periodos.create({
            data: {
              MATRICULA_SEM_PONTO: funcionario.MATRICULA_F,
              PERIODO_AQUISITIVO_EM_ABERTO: periodoAquisitivo,
              // SALDO: 30, // Você pode descomentar esta linha se quiser
            },
          });
        }
      }
    }
    return res.status(200).json({ message: 'Períodos aquisitivos gerados com sucesso.' });
  } catch (error) {
    console.error('Erro ao gerar períodos aquisitivos:', error);
    return res.status(500).json({ error: 'Erro ao gerar períodos aquisitivos.' });
  }
};

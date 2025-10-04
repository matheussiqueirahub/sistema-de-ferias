import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

type StatusGerencia = "pendente" | "aprovado" | "reprovado";
type VacationStatus = "PENDING" | "APPROVED" | "REJECTED";

type FeriasResponse = {
  id: number;
  colaborador: string;
  servidor?: number;
  dataInicio: string;
  dataFim: string;
  statusGerencia: StatusGerencia;
  observacaoGerencia?: string | null;
};

const vacationToStatus: Record<VacationStatus, StatusGerencia> = {
  PENDING: "pendente",
  APPROVED: "aprovado",
  REJECTED: "reprovado",
};

const statusToVacation: Record<StatusGerencia, VacationStatus> = {
  pendente: "PENDING",
  aprovado: "APPROVED",
  reprovado: "REJECTED",
};

const mapFeriasToResponse = (ferias: {
  id: number;
  inicio: Date;
  fim: Date;
  status: VacationStatus;
  observation: string | null;
  servidorId: number;
  servidor: { name: string | null } | null;
}): FeriasResponse => ({
  id: ferias.id,
  colaborador: ferias.servidor?.name ?? `Servidor ${ferias.servidorId}`,
  servidor: ferias.servidorId,
  dataInicio: ferias.inicio.toISOString(),
  dataFim: ferias.fim.toISOString(),
  statusGerencia: vacationToStatus[ferias.status],
  observacaoGerencia: ferias.observation,
});

router.get("/", async (_req, res) => {
  try {
    const registros = await prisma.ferias.findMany({
      include: {
        servidor: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(registros.map(mapFeriasToResponse));
  } catch (error) {
    console.error("Erro ao listar solicitações de férias:", error);
    res.status(500).json({ error: "Erro ao listar solicitações de férias." });
  }
});

const updateSchema = z.object({
  statusGerencia: z.enum(["pendente", "aprovado", "reprovado"]).optional(),
  observacaoGerencia: z.string().max(1000).optional(),
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Identificador inválido." });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { statusGerencia, observacaoGerencia } = parsed.data;

  if (!statusGerencia && typeof observacaoGerencia === "undefined") {
    return res.status(400).json({ error: "Nada para atualizar." });
  }

  try {
    const registro = await prisma.ferias.findUnique({
      where: { id },
      include: {
        servidor: {
          select: { name: true },
        },
      },
    });

    if (!registro) {
      return res.status(404).json({ error: "Solicitação não encontrada." });
    }

    const atualizado = await prisma.ferias.update({
      where: { id },
      data: {
        status: statusGerencia ? statusToVacation[statusGerencia] : registro.status,
        observation: typeof observacaoGerencia === "string" ? observacaoGerencia : registro.observation,
      },
      include: {
        servidor: {
          select: { name: true },
        },
      },
    });

    res.json(mapFeriasToResponse(atualizado));
  } catch (error) {
    console.error("Erro ao atualizar solicitação de férias:", error);
    res.status(500).json({ error: "Erro ao atualizar solicitação de férias." });
  }
});

export default router;

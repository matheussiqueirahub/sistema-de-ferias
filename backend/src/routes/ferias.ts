import { Router } from "express";
import { prisma } from "../prisma";
import { authRequired, requireRole } from "../middleware/auth";
import { z } from "zod";
import { notify } from "../notifications";

const router = Router();

const createSchema = z.object({
  inicio: z.string().datetime(),
  fim: z.string().datetime(),
});

router.post("/", authRequired, requireRole("SERVIDOR", "ADMIN"), async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { inicio, fim } = parse.data;
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!me) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!me.managerId || !me.executiveId) return res.status(400).json({ error: "Defina gerente e secretário executivo para o servidor" });

  const overlap = await prisma.ferias.findFirst({
    where: {
      servidorId: me.id,
      OR: [
        { AND: [{ inicio: { lte: new Date(fim) } }, { fim: { gte: new Date(inicio) } }] },
      ],
    },
  });
  if (overlap) return res.status(409).json({ error: "Período de férias conflita com uma solicitação existente" });

  const created = await prisma.ferias.create({
    data: {
      servidorId: me.id,
      managerId: me.managerId,
      executiveId: me.executiveId,
      inicio: new Date(inicio),
      fim: new Date(fim),
      status: "PENDING",
    },
  });

  await notify(me.managerId, `Nova solicitação de férias de ${me.name}`);
  res.status(201).json(created);
});

router.get("/mine", authRequired, requireRole("SERVIDOR", "ADMIN"), async (req, res) => {
  const list = await prisma.ferias.findMany({
    where: { servidorId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(list);
});

router.get("/pending", authRequired, requireRole("GERENTE", "ADMIN"), async (req, res) => {
  const list = await prisma.ferias.findMany({
    where: { managerId: req.user!.id, status: "PENDING" },
    include: { servidor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(list);
});

const decideSchema = z.object({ approved: z.boolean(), observacao: z.string().optional() });

router.post("/:id/decide", authRequired, requireRole("GERENTE", "ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const parse = decideSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { approved, observacao } = parse.data;

  const ferias = await prisma.ferias.findUnique({ where: { id } });
  if (!ferias) return res.status(404).json({ error: "Solicitação não encontrada" });
  if (ferias.managerId !== req.user!.id && req.user!.role !== "ADMIN") return res.status(403).json({ error: "Sem permissão" });
  if (ferias.status !== "PENDING") return res.status(400).json({ error: "Solicitação já decidida" });

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.ferias.update({
      where: { id },
      data: { status: approved ? "APPROVED" : "REJECTED", observation: observacao ?? null },
    });
    await tx.approvalHistory.create({
      data: {
        feriasId: id,
        managerId: req.user!.id,
        approved,
        observacao,
      },
    });
    return u;
  });

  await notify(ferias.servidorId, `Sua solicitação de férias foi ${approved ? "aprovada" : "reprovada"}.`);
  await notify(ferias.executiveId, `Solicitação de férias de servidor ${ferias.servidorId} foi ${approved ? "aprovada" : "reprovada"}.`);

  res.json(updated);
});

router.get("/history/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const list = await prisma.approvalHistory.findMany({ where: { feriasId: id }, orderBy: { createdAt: "desc" } });
  res.json(list);
});

export default router;
router.get("/all", authRequired, requireRole("SECRETARIO_EXECUTIVO", "ADMIN"), async (_req, res) => {
  const list = await prisma.ferias.findMany({
    include: { servidor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(list);
});

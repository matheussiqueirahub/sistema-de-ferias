import { Router } from "express";
import { prisma } from "../prisma";
import { authRequired } from "../middleware/auth";

const router = Router();

router.get("/me", authRequired, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, managerId: true, executiveId: true },
  });
  res.json(me);
});

router.get("/managers", authRequired, async (_req, res) => {
  const list = await prisma.user.findMany({ where: { role: "GERENTE" }, select: { id: true, name: true, email: true } });
  res.json(list);
});

router.get("/executives", authRequired, async (_req, res) => {
  const list = await prisma.user.findMany({ where: { role: "SECRETARIO_EXECUTIVO" }, select: { id: true, name: true, email: true } });
  res.json(list);
});

export default router;

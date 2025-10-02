import { Router } from "express";
import { prisma } from "../prisma";
import { authRequired } from "../middleware/auth";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  const list = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" } });
  res.json(list);
});

router.post("/:id/read", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const notif = await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json(notif);
});

export default router;

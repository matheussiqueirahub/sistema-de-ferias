import { prisma } from "./prisma";

export async function notify(userId: number, message: string) {
  await prisma.notification.create({ data: { userId, message } });
}

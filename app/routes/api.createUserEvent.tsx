import type { ActionFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();
  console.log("payload", payload);
  const userExist = await prisma.user.findFirst({
    where: {
      OR: [
        {
          ip: payload.ip,
        },
        {
          events: {
            some: {
              cartId: payload.cartId,
            },
          },
        },
      ],
    },
  });

  if (userExist === null) {
    var newUser = await prisma.user.create({
      data: {
        UTM: payload.utms ?? {
          utmSource: "",
          utmMedium: "",
          utmCampaign: "",
          valid: false,
        },
        timeCreated: new Date().toISOString(),
        timeUpdated: new Date().toISOString(),
        ip: payload.ip ?? "",
        events: {
          create: [
            {
              type: payload.event,
              timeCreated: new Date().toISOString(),
              timeUpdated: new Date().toISOString(),
              lines: payload.items,
              value:
                typeof payload.value === "string"
                  ? parseFloat(payload.value)
                  : payload.value,
              cartId: payload.cartId,
            },
          ],
        },
      },
    });
  } else {
    var newUser = await prisma.user.update({
      where: {
        id: userExist.id,
      },
      data: {
        timeUpdated: new Date().toISOString(),
        events: {
          create: [
            {
              type: payload.event,
              timeCreated: new Date().toISOString(),
              timeUpdated: new Date().toISOString(),
              lines: payload.items,
              value: payload.value,
              cartId: payload.cartId,
            },
          ],
        },
      },
    });
  }

  return { status: 200, body: newUser };
}

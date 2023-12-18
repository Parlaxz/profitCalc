import { PrismaClient } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getCSTOrderDate } from "~/apiHelpers";
export const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();
  console.log("payload", payload);
  console.log("payload?.checkout_id", payload?.checkout_id);
  console.log("payload?.checkout_token", payload?.checkout_token);
  console.log("payload?.cart_token", payload?.cart_token);

  const order = {
    revenue: parseFloat(payload?.total_price),
    createdAt: getCSTOrderDate(payload?.created_at),
    ip: payload?.browser_ip ?? "",
    cartId: payload?.cart_token ?? "",
    lineItems: payload?.line_items?.map((lineItem) => {
      return {
        title: lineItem?.title,
        quantity: lineItem?.quantity,
        price: lineItem?.price,
      };
    }),
  };

  try {
    const userExist = await prisma.user.findFirst({
      where: {
        OR: [
          {
            ip: order.ip,
          },
          {
            events: {
              some: {
                cartId: order.cartId,
              },
            },
          },
        ],
      },
    });

    if (userExist === null) {
      var newUser = await prisma.user.create({
        data: {
          UTM: {
            utmSource: "",
            utmMedium: "",
            utmCampaign: "",
            valid: false,
          },
          timeCreated: new Date().toISOString(),
          timeUpdated: new Date().toISOString(),
          ip: order.ip ?? "",
          events: {
            create: [
              {
                type: "initiateCheckout",
                timeCreated: new Date().toISOString(),
                timeUpdated: new Date().toISOString(),
                lines: order.lineItems,
                value: order.revenue,
                cartId: order.cartId,
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
                type: "initiatedCheckout",
                timeCreated: new Date().toISOString(),
                timeUpdated: new Date().toISOString(),
                lines: order.lineItems,
                value: order.revenue,
                cartId: order.cartId,
              },
            ],
          },
        },
      });
    }

    console.log("newUser", newUser);
  } catch (err) {
    console.log("user creation / updating with order failed with err:", err);
  }
  return { status: 200, body: order };
}

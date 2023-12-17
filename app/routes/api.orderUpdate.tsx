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
    revenue: parseFloat(payload?.current_total_price),
    customer: `${payload?.customer?.first_name} ${payload?.customer?.last_name}`,
    createdAt: getCSTOrderDate(payload?.created_at),
    orderNumber: parseInt(payload?.name?.slice(1)),
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
  //Try to add the order to shopifyOrders
  try {
    const prismaOrder = await prisma.shopifyOrder.upsert({
      where: {
        orderNumber: order.orderNumber,
      },
      update: {},
      create: order,
    });
    console.log("prismaOrder", prismaOrder);
  } catch (err) {
    console.log("shopify Order creation failed with error:", err);
  }

  try {
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
          UTM: {
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
                value: payload.value,
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

    console.log("newUser", newUser);
  } catch (err) {
    console.log("user creation / updating with order failed with err:", err);
  }
  return { status: 200, body: order };
}

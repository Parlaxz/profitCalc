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
    const getUser = await prisma.user.findFirst({
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
    let arr = [
      {
        type: "purchase",
        timeCreated: new Date().toISOString(),
        lines: order.lineItems,
        value: order.revenue,
        cartId: order.cartId,
      },
    ];
    if (getUser) {
      arr = [...getUser.events, ...arr];
    }

    const upsertUser = await prisma.user.upsert({
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
      update: {
        timeUpdated: new Date().toISOString(),
        events: arr,
      },
      create: {
        UTM: {
          utmSource: "",
          utmMedium: "",
          utmCampaign: "",
          valid: false,
        },
        timeCreated: new Date().toISOString(),
        timeUpdated: new Date().toISOString(),
        ip: order.ip,
        events: arr,
      },
    });
  } catch (err) {
    console.log("user creation / updating with order failed with err:", err);
  }
  return { status: 200, body: order };
}

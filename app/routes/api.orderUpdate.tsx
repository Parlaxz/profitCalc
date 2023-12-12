import { PrismaClient } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getOrderDate } from "~/apiHelpers";
export const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();
  const order = {
    revenue: parseFloat(payload?.current_total_price),
    customer: `${payload?.customer?.first_name} ${payload?.customer?.last_name}`,
    createdAt: getOrderDate(payload?.created_at),
    orderNumber: parseInt(payload?.name?.slice(1)),
    ip: payload?.browser_ip ?? "",
    lineItems: payload?.line_items?.map((lineItem) => {
      return {
        title: lineItem?.title,
        quantity: lineItem?.quantity,
        price: lineItem?.price,
      };
    }),
  };

  try {
    const prismaOrder = await prisma.shopifyOrder.create({
      data: order,
    });
  } catch (err) {
    console.log("shopify Order creation failed with error:", err);
  }

  try {
    const getUser = await prisma.user.findFirst({
      where: {
        ip: order.ip,
      },
    });
    let arr = [
      {
        type: "purchase",
        timeCreated: new Date().toISOString(),
        lines: order.lineItems,
        value: order.revenue,
      },
    ];
    if (getUser) {
      arr = [...getUser.events, ...arr];
    }

    const upsertUser = await prisma.user.upsert({
      where: {
        ip: order.ip,
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
        events: [
          {
            type: "purchase",
            timeCreated: new Date().toISOString(),
            lines: order.lineItems,
            value: order.revenue,
          },
        ],
      },
    });
  } catch (err) {
    console.log("user creation / updating with order failed with err:", err);
  }
  console.log("prismaOrder", prismaOrder);
  return { status: 200, body: order };
}

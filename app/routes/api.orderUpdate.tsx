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
    ip: payload?.browser_ip,
    lineItems: payload?.line_items?.map((lineItem) => {
      return {
        title: lineItem?.title,
        quantity: lineItem?.quantity,
        price: lineItem?.price,
      };
    }),
  };
  prisma.shopifyOrder.create({
    data: order,
  });
  return { status: 200, body: order };
}

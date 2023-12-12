import { PrismaClient } from "@prisma/client";
import type { ActionFunctionArgs} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  getLatestOrder,
  getOrderDate,
  updateShopifyOrders,
} from "~/apiHelpers";
export const prisma = new PrismaClient();

export async function loader({ request }: ActionFunctionArgs) {
  try {
    const latestOrder = await getLatestOrder();
    await updateShopifyOrders(
      latestOrder?.orderNumber ? latestOrder?.orderNumber : 1000
    );
    console.log("updating");
  } catch (err) {
    console.error(err);
  }

  return redirect("/");
}

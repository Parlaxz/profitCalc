import type { ActionFunctionArgs } from "@remix-run/node";
import { getOrderDate } from "~/apiHelpers";

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();
  console.log("payload", payload);
  // {
  //   "_id": {
  //     "$oid": "656958aa8a86013fbdbf9da5"
  //   },
  //   "revenue": 34.99,
  //   "customer": "LEONARDO AVINA",
  //   "createdAt": "2021-03-24",
  //   "orderNumber": {
  //     "$numberLong": "1001"
  //   },
  //   "lineItems": [
  //     {
  //       "title": "Jujutsu Kaisen Pullover Hoodie",
  //       "quantity": 1,
  //       "price": "29.99"
  //     }
  //   ]
  // }
  console.log("createdAt", payload?.created_at);
  console.log("lineItems", payload?.line_items);
  console.log("currentTotalPrice", payload?.current_total_price);
  console.log("currentSubTotalPrice", payload?.current_subtotal_price);
  console.log(
    "name",
    `${payload?.customer?.first_name} ${payload?.customer?.last_name}`
  );
  const order = {
    revenue: parseFloat(payload?.current_total_price),
    customer: `${payload?.customer?.first_name} ${payload?.customer?.last_name}`,
    createdAt: getOrderDate(payload?.created_at),
    orderNumber: parseInt(payload?.name?.slice(1)),
    lineItems: payload?.line_items?.map((lineItem) => {
      return {
        title: lineItem?.title,
        quantity: lineItem?.quantity,
        price: lineItem?.price,
      };
    }),
  };
  console.log("order", order);
  console.log("customer");
  console.log("orderNumber");
  return { status: 200, body: "ok" };
}

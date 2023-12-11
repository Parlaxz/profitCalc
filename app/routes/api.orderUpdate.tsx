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
  console.log("createdAt", payload?.createdAt);
  const order = {
    revenue: parseFloat(payload?.netPaymentSet?.shopMoney?.amount),
    customer: payload?.customer?.displayName
      ? payload?.customer?.displayName
      : "",
    createdAt: getOrderDate(payload?.createdAt),
    orderNumber: parseInt(payload?.name?.slice(1)),
    lineItems: payload?.lineItems?.map((lineItem) => {
      return {
        title: lineItem?.node?.title,
        quantity: lineItem?.node?.quantity,
        price: lineItem?.node?.originalUnitPriceSet?.shopMoney?.amount,
      };
    }),
  };
  console.log("order", order);
  console.log("customer");
  console.log("orderNumber");
  console.log("lineItems");
  console.log("createdAt");
  return { status: 200, body: "ok" };
}

import type { MetaFunction } from "@remix-run/node";
import {
  addDaysToDate,
  getPrintifyOrders,
  getPrintifyRevenue,
  getShopifyGrossRevenue,
  getShopifyOrders,
  getShopifyRevenue,
  printStats,
} from "~/apiHelpers";
import OrderForm from "~/components/orderForm";

export async function loader() {
  //config
  const metaAds = 605;
  const startDate = "2023-11-27";
  let endDate = "2023-11-27";
  endDate = addDaysToDate(endDate, 1);

  const shopifyOrders = await getShopifyOrders(startDate, endDate);
  const shopifyRevenue = getShopifyRevenue(shopifyOrders);
  const shopifyGrossRevenue = getShopifyGrossRevenue(shopifyRevenue);

  let printifyOrders = await getPrintifyOrders(
    parseInt(shopifyOrders[0].orderName),
    parseInt(shopifyOrders[shopifyOrders.length - 1].orderName)
  );
  let totalPrice = getPrintifyRevenue(printifyOrders);
  printStats(shopifyGrossRevenue, totalPrice, metaAds);
  return null;
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// ./app/routes/index.tsx
export default function Index() {
  return (
    <div className="h-screen bg-slate-700 flex justify-center items-center">
      <h2 className="text-blue-600 font-extrabold text-5xl">
        TailwindCSS Is Working!
      </h2>
    </div>
  );
}

export type ShopifyOrderType = {
  id: string;
  sourceIdentifier: string;
  revenue: number;
  customer: string;
  createdAt: string;
  orderName: string;
};
export type RawShopifyOrder = {
  node: {
    id: string;
    name: string;
    customer: {
      displayName: string;
    };
    createdAt: string;
    sourceIdentifier: string;
    netPaymentSet: {
      shopMoney: { amount: string };
    };
  };
};
export type PrintifyOrder = {
  orderNumber: number;
  total_price: number;
  total_tax: number;
  total_shipping: number;
};

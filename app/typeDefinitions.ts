export type ShopifyOrderType = {
  id: string;
  sourceIdentifier: string;
  revenue: number;
  customer: string;
  createdAt: string;
  orderName: string;
};
export interface PrismaShopifyOrder {
  id: string;
  revenue: number;
  customer: string;
  createdAt: string;
  orderName: string;
  lineItems: {
    title: string;
    quantity: number;
    price: string;
  }[];
}
export type PrintifyOrder = {
  orderNumber: number;
  total_price: number;
  total_tax: number;
  total_shipping: number;
};
export interface RawShopifyOrder {
  node: {
    id: string;
    netPaymentSet: {
      shopMoney: {
        amount: string;
      };
    };
    customer: {
      displayName: string;
    };
    createdAt: string;
    name: string;
    lineItems: {
      edges: {
        node: {
          title: string;
          quantity: number;
          originalUnitPriceSet: {
            shopMoney: {
              amount: string;
            };
          };
        };
      }[];
    };
  };
}
export interface ShopifyOrderData {
  revenue: number;
  customer: string;
  createdAt: string | null;
  orderNumber: number;
  lineItems: LineItem[];
}

export interface LineItem {
  title: string | null;
  quantity: number | null;
  price: number | null;
}

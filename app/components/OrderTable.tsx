import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";
import type { OrderTableProps } from "~/typeDefinitions";

// OrderTable.js
export const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleRowClick = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };
  useEffect(() => {
    orders.reverse();
  }, []);
  console.log("lineItems", orders[0].shopifyLineItems);
  return (
    <div className="container mx-auto mt-8 overflow-scroll">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Order #</th>
            <th className="py-2 px-4 border-b">Customer Name</th>
            <th className="py-2 px-4 border-b">Shopify #Items</th>
            <th className="py-2 px-4 border-b">Printify #Items</th>
          </tr>
        </thead>
        <tbody>
          {orders
            .sort((a, b) => {
              return b.orderNumber - a?.orderNumber;
            })
            .map((order, index) => (
              <React.Fragment key={index}>
                <tr
                  className="cursor-pointer transition-all hover:bg-gray-100"
                  onClick={() => handleRowClick(index)}
                >
                  <td className="py-2 px-4 border-b flex items-center">
                    {order.orderNumber}
                    {order.printifyNumLineItems !==
                      order.shopifyLineItems?.length && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-600 ml-2" />
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{order.customerName}</td>
                  <td className="py-2 px-4 border-b">
                    {order.shopifyLineItems.length}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {order.printifyNumLineItems}
                  </td>
                </tr>
                {expandedRow === index && (
                  <tr>
                    <td colSpan={4}>
                      <div className="p-4">
                        <p>Order Date: {order.orderDate}</p>
                        <p>Revenue: ${order.revenue}</p>
                        <p>
                          Product Cost: $
                          {order.cost ? (order.cost / 100).toFixed(2) : ""}
                        </p>
                        <p>
                          Shipping: $
                          {order.shipping
                            ? (order.shipping / 100).toFixed(2)
                            : ""}
                        </p>
                        <p>
                          Tax: ${order.tax ? (order.tax / 100).toFixed(2) : ""}
                        </p>
                        {order.shopifyLineItems?.map((lineItem) => {
                          return (
                            <div key={lineItem?.title}>{lineItem?.title}</div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
};

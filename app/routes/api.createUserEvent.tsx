import type { ActionFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();
  console.log("payload", payload);
  // Example of above console log Payload for ATC
  //  payload {
  //   event: 'AddToCart',
  //   items: { lines: [ [Object] ] },
  //   userId: '1a942155819c',
  //   utms: { utmSource: null, utmMedium: null, utmCampaign: null, valid: false }
  // }

  //TODO: if the payload event is  AddToCart, console.log each line item, the user id, and if the utm is valid

  //Example of above console log Payload for InitiateCheckout event
  // payload {
  //   event: 'InitiateCheckout',
  //   items: {
  //     totalAmount: {
  //       subtotalAmount: [Object],
  //       totalAmount: [Object],
  //       totalDutyAmount: null,
  //       totalTaxAmount: [Object]
  //     },
  //     lines: [ [Object] ]
  //   },
  //   userId: '1a942155819c',
  //   utms: { utmSource: null, utmMedium: null, utmCampaign: null, valid: false }
  // }

  // Example of above console log Payload for AcceleratedCheckout event
  // payload {
  //   event: 'AcceleratedCheckout',
  //   items: {
  //     productTitle: 'Jujutsu Kaisen Sweatshirt',
  //     productVariant: 'White / XL',
  //     price: { amount: '42.99', currencyCode: 'USD' }
  //   },
  //   userId: '1a942155819c',
  //   utms: { utmSource: null, utmMedium: null, utmCampaign: null, valid: false }
  // }
  //TODO: if the payload event is  InitiateCheckout or Accelerated Checkout, console.log the total amount, lines, the user id, and if the utm is valid

  // TODO: If the payload event is InitiateCheckout or Accelerated Checkout, console.log the total amount, lines, the user id, and if the utm is valid
  const getUser = await prisma.user.findFirst({
    where: {
      ip: payload.ip,
    },
  });
  let arr = [
    {
      type: payload.event,
      timeCreated: new Date().toISOString(),
      lines: payload.items,
      value: payload.value,
    },
  ];
  if (getUser) {
    arr = [...getUser.events, ...arr];
  }

  const upsertUser = await prisma.user.upsert({
    where: {
      ip: payload.ip,
    },
    update: {
      timeUpdated: new Date().toISOString(),
      events: arr,
      UTM: getUser?.UTM?.valid
        ? getUser?.UTM
        : payload.utms ?? {
            utmSource: "",
            utmMedium: "",
            utmCampaign: "",
            valid: false,
          },
    },
    create: {
      UTM: payload.utms ?? {
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        valid: false,
      },
      timeCreated: new Date().toISOString(),
      timeUpdated: new Date().toISOString(),
      ip: payload.ip,
      events: [
        {
          type: payload.event,
          timeCreated: new Date().toISOString(),
          lines: payload.items,
          value: payload.value,
        },
      ],
    },
  });

  return { status: 200, body: upsertUser };
}

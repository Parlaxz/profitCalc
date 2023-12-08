import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const bodyParams = await request.body;

  return { status: 200, body: bodyParams };
}

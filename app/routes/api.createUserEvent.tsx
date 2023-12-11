import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();
  console.log("payload", payload);
  return { status: 200, body: "ok" };
}

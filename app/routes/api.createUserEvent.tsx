import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  console.log(request);
  console.log("request.body", request.body);

  return { status: 200, body: "ok" };
}

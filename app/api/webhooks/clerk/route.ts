import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET!;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing WEBHOOK_SECRET in environment variables");
  }

  let evt;

  try {
    evt = await verifyWebhook(req, { signingSecret: WEBHOOK_SECRET });

    console.log("Event type:", evt.type);
    console.log("Event data:", evt.data);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { type, data } = evt;

  // CREATE
  if (type === "user.created") {
    const { id, email_addresses, image_url, first_name, last_name, username } =
      data;

    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      username: username!,
      firstName: first_name ?? "",
      lastName: last_name ?? "",
      photo: image_url,
    };

    const newUser = await createUser(user);

    if (newUser) {
      const client = await clerkClient();

      await client.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id,
        },
      });
    }

    return NextResponse.json({ message: "OK", user: newUser });
  }

  // UPDATE
  if (type === "user.updated") {
    const { id, image_url, first_name, last_name, username } = data;

    const user = {
      firstName: first_name ?? "",
      lastName: last_name ?? "",
      username: username!,
      photo: image_url,
    };

    const updatedUser = await updateUser(id, user);
    return NextResponse.json({ message: "OK", user: updatedUser });
  }

  // DELETE
  if (type === "user.deleted") {
    const deletedUser = await deleteUser(data.id!);
    return NextResponse.json({ message: "OK", user: deletedUser });
  }

  return NextResponse.json({ message: "Unhandled event type" });
}

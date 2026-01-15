"use server";

import Stripe from "stripe";

import { CheckoutTransactionParams, CreateTransactionParams } from "@/types";
import { redirect } from "next/navigation";
import { connectToDB } from "../database/db";
import Transaction from "../database/models/transaction.model";
import { handleError } from "../utils";
import { updateCredits } from "./user.actions";

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  try {
    const stripe = new Stripe(process.env.NEXT_SECRET_KEY!);

    const amount = Number(transaction.amount) * 100;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: transaction.plan,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: transaction.plan,
        credits: transaction.credits,
        buyerId: transaction.buyerId,
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    });

    redirect(session.url!);
  } catch (error) {
    console.error("Error in checkoutCredits:", error);
    throw new Error("Failed to execute checkoutCredits");
  }
}

export async function createTransaction(transaction: CreateTransactionParams) {
  try {
    await connectToDB();

    // create a new transation with buyerId
    const newTransation = await Transaction.create({
      ...transaction,
      buyer: transaction.buyerId,
    });

    await updateCredits(transaction.buyerId, transaction.credits);

    return JSON.parse(JSON.stringify(newTransation));
  } catch (error) {
    handleError(error);
  }
}

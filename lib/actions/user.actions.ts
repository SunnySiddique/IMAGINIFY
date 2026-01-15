"use server";

import { CreateUserParams, UpdateUserParams } from "@/types";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../database/db";
import User from "../database/models/user.model";
import { handleError } from "../utils";

// CREATE
export async function createUser(user: CreateUserParams) {
  try {
    await connectToDB();

    const newUser = await User.create(user);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    handleError(error);
  }
}

// READ
export async function getUserById(userId: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ clerkId: userId });

    if (!user) throw new Error("User not found");

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error getting user:", error);
    handleError(error);
  }
}

// UPDATE
export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDB();

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });

    if (!updatedUser) throw new Error("User update failed");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    console.error("Error updating user:", error);
    handleError(error);
  }
}

// DELETE
export async function deleteUser(clerkId: string) {
  try {
    await connectToDB();

    const userToDelete = await User.findOne({ clerkId });

    if (!userToDelete) throw new Error("User not found");

    const deletedUser = await User.findByIdAndDelete(userToDelete._id); // Fixed: use _id
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    console.error("Error deleting user:", error);
    handleError(error);
  }
}

// USE CREDITS

export async function updateCredits(userId: string, creditFee: number) {
  try {
    await connectToDB();

    const updatedUserCredits = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { creditBalance: creditFee } },
      { new: true }
    );

    if (!updateCredits) throw new Error("user credits updsate failed");

    return JSON.parse(JSON.stringify(updatedUserCredits));
  } catch (error) {
    handleError(error);
  }
}

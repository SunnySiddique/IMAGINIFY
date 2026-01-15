"use server";

import { AddImageParams, UpdateImageParams } from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDB } from "../database/db";
import Image from "../database/models/image.model";
import User from "../database/models/user.model";
import { handleError } from "../utils";

const populateUser = (query: any) =>
  query.populate({
    path: "author",
    model: User,
    select: "_id firstName lastName clerkId",
  });

// ADD IMAGE
export async function addImage({ image, userId, path }: AddImageParams) {
  try {
    await connectToDB();
    const author = await User.findById(userId);

    if (!author) throw new Error("User not found!");

    const newImage = await Image.create({
      ...image,
      author: author._id,
    });

    revalidatePath(path);

    return JSON.parse(JSON.stringify(newImage));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE IMAGE
export async function updateImage({ image, userId, path }: UpdateImageParams) {
  try {
    await connectToDB();

    const imageToUpdate = await Image.findById(image._id);

    if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
      throw new Error("Unauthorized or image not found");
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageToUpdate._id,
      image,
      { new: true }
    );

    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error);
  }
}

// DELETE IMAGE
export async function deleteImage(imageId: string) {
  try {
    await connectToDB();

    await Image.findByIdAndDelete(imageId);
  } catch (error) {
    handleError(error);
  } finally {
    redirect("/");
  }
}

// GET IMAGE
export async function getImageById(imageId: string) {
  try {
    await connectToDB();

    const image = await populateUser(Image.findById(imageId));

    if (!image) throw new Error("Image not found!");

    return JSON.parse(JSON.stringify(image));
  } catch (error) {
    handleError(error);
  }
}

// GET ALL IMAGES
export async function getAllImages({
  limit = 9,
  page = 1,
  searchQuery = "",
}: {
  limit?: number;
  page: number;
  searchQuery: string;
}) {
  try {
    await connectToDB();

    const skipAmount = (page - 1) * limit;

    const query = searchQuery
      ? {
          title: { $regex: searchQuery, $options: "i" },
        }
      : {};

    const images = await populateUser(
      Image.find(query).sort({ updatedAt: -1 }).skip(skipAmount).limit(limit)
    );

    const totalImages = await Image.countDocuments(query);

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPage: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}

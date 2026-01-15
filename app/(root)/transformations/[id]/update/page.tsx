import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Header from "@/components/shared/Header";
import TransformationForm from "@/components/shared/TransformationForm";
import { transformationTypes } from "@/constants";
import { getImageById } from "@/lib/actions/image.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { TransformationTypeKey } from "@/types";

type UpdateImagePageProps = {
  params: Promise<{ id: string }>;
};

const UpdateImagePage = async ({ params }: UpdateImagePageProps) => {
  const { id } = await params;

  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  const image = await getImageById(id);

  const transformation =
    transformationTypes[image.transformationType as TransformationTypeKey];

  return (
    <>
      <Header title={transformation.title} subtitle={transformation.subTitle} />

      <section className="mt-10">
        <TransformationForm
          action="Update"
          userId={user._id}
          type={image.transformationType as TransformationTypeKey}
          creditBalance={user.creditBalance}
          config={image.config}
          data={image}
        />
      </section>
    </>
  );
};

export default UpdateImagePage;

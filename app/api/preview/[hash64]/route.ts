import { NextResponse } from "next/server";

import { base64ToHex, getLinkInfoFromWhatsLink } from "@/utils";
import { getPreviewInfo, success, fail } from "../service";

const invalid = (message: string) => {
  return NextResponse.json(
    {
      message,
      status: 400,
    },
    {
      status: 400,
    },
  );
};

// Function to handle GET requests
const handler = async (
  request: Request,
  { params }: { params: { hash64: string } },
) => {
  try {
    const linkInfo = await getPreviewInfo(params.hash64);

    console.log(linkInfo);

    const data = {
      name: linkInfo.name,
      size: linkInfo.size,
      screenshots: linkInfo.screenshots?.map(
        (_item, index) => `${request.url}/${index}`,
      ),
    };

    return success(data);
  } catch (error: any) {
    console.error(error);

    return fail(error.message || "Internal Server Error");
  }
};

export { handler as GET, handler as POST };

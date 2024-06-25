import { NextResponse } from "next/server";

import { fail, getPreviewInfo } from "../../service";

// Function to handle GET requests
const handler = async (
  request: Request,
  { params }: { params: { hash64: string; id: number } },
) => {
  try {
    const linkInfo = await getPreviewInfo(params.hash64);

    const screenshots = linkInfo.screenshots?.map((item) => item.screenshot);

    const imageUrl = screenshots?.[params.id];

    if (!imageUrl) {
      return fail("Image not found", 404);
    }

    // Fetch the image from the URL and return it
    const response = await fetch(imageUrl, {
      headers: {
        Referer: request.url,
      },
    });
    const buffer = await response.arrayBuffer();

    console.log("====================================");
    console.log("imageUrl", imageUrl);
    console.log("buffer", buffer);
    console.log("====================================");

    // Return a 200 response with the image data
    return new Response(buffer, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
      },
    });
  } catch (error: any) {
    console.error(error);

    // Return a 500 response if there's an error during the query execution
    return NextResponse.json(
      {
        message: error?.message || "Internal Server Error",
        status: 500,
      },
      {
        status: 500,
      },
    );
  }
};

export { handler as GET, handler as POST };

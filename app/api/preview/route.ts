import { NextResponse } from "next/server";

const handler = async () => {
  return NextResponse.json(
    {
      message: "Invalid request",
      status: 400,
    },
    {
      status: 400,
    },
  );
};

export { handler as GET, handler as POST };

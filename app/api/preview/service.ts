import { NextResponse } from "next/server";

import { base64ToHex, getLinkInfoFromWhatsLink } from '@/utils';

export const fail = (message: string, status: number = 500) => {
  return NextResponse.json(
    {
      message,
      status,
    },
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
};

export const success = (data: any) => {
  return NextResponse.json(
    {
      data,
      message: "success",
      status: 200,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
};

export async function getPreviewInfo(hash64: string) {
  const hash = base64ToHex(hash64);

  if (!hash || hash.length !== 40) {
    console.error("Invalid hash", hash);

    throw new Error("Invalid hash");
  }

  const magnet_uri = `magnet:?xt=urn:btih:${hash}`;

  const linkInfo = await getLinkInfoFromWhatsLink(magnet_uri);

  if (!linkInfo || linkInfo.error) {
    console.error("Invalid link", linkInfo);

    throw new Error("Invalid link");
  }

  return linkInfo;
}

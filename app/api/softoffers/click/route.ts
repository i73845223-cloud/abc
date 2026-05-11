import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sendClickPostback } from "@/lib/softoffers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { promoCode } = body;

  const cookieStore = await cookies();
  const clickId = cookieStore.get("partnerClickId")?.value;
  const alreadyFired = cookieStore.get("softoffers_click_fired")?.value;

  if (!clickId || alreadyFired === "1" || !promoCode) {
    return NextResponse.json({ skipped: true });
  }

  const promo = await db.promoCode.findUnique({
    where: { code: promoCode },
  });

  if (promo) {
    await db.click.create({
      data: {
        promoCodeId: promo.id,
        clickId,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent") || "",
      },
    });
  }

  await sendClickPostback(clickId);

  const response = NextResponse.json({ success: true });
  response.cookies.set("softoffers_click_fired", "1", {
    maxAge: 3600,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
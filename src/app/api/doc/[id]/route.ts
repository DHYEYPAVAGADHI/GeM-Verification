import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorised", { status: 401 });

  const doc =
    (await db.bidDocument.findUnique({ where: { id: params.id }, include: { bid: true } })) ??
    null;
  const profileDoc = doc ? null : await db.profileDocument.findUnique({ where: { id: params.id } });

  if (!doc && !profileDoc) return new Response("Not found", { status: 404 });

  const role = session.user.role;
  if (role === "VENDOR") {
    const ownVendor = session.user.vendorId;
    if (doc && doc.bid.vendorId !== ownVendor) return new Response("Forbidden", { status: 403 });
    if (profileDoc && profileDoc.vendorId !== ownVendor) return new Response("Forbidden", { status: 403 });
  }

  const bytes = doc ? doc.bytes : profileDoc!.bytes;
  const name = doc ? doc.fileName : profileDoc!.fileName;
  const mime = doc ? doc.mimeType : profileDoc!.mimeType;

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}

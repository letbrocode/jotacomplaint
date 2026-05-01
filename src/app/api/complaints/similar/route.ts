import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { findSimilarComplaints } from "~/server/services/duplicate.service";

// ============================================
// GET /api/complaints/similar?title=...&lat=...&lng=...
// Returns up to 5 similar open complaints.
// Used by the complaint submission form to
// surface potential duplicates before submit.
// ============================================

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.trim() ?? "";
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;
  const excludeId = searchParams.get("excludeId") ?? undefined;

  if (title.length < 5) {
    return NextResponse.json({ similar: [] });
  }

  try {
    const similar = await findSimilarComplaints(title, {
      lat,
      lng,
      excludeId,
      limit: 5,
    });

    return NextResponse.json({ similar });
  } catch (err) {
    console.error("Similar complaints error:", err);
    return NextResponse.json({ similar: [] });
  }
}

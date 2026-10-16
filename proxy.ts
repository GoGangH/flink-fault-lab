import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin(발표자 대본) 접근 제한. 브라우저 기본 로그인 창(HTTP Basic Auth)을 띄운다.
 * 아이디는 아무거나, 비밀번호는 환경변수 ADMIN_PASSWORD.
 * 로컬 개발에서 ADMIN_PASSWORD를 비워 두면 그냥 통과시킨다.
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("ADMIN_PASSWORD 환경변수를 설정해야 대본을 볼 수 있습니다.", { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (given === password) return NextResponse.next();
  }

  return new NextResponse("인증이 필요합니다.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="presenter", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

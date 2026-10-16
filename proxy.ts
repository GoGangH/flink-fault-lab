import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin(발표자 대본) 접근 제한. 선택 사항이다.
 * 환경변수 ADMIN_PASSWORD가 없으면 누구나 열 수 있고,
 * 설정하면 브라우저 기본 로그인 창(HTTP Basic Auth)을 띄운다. 아이디는 아무거나, 비밀번호는 ADMIN_PASSWORD.
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.next();

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

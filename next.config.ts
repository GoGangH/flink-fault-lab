import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 대본 페이지 실제 경로는 /script (한글 폴더명은 빌드 때 사전 렌더링이 안 됨).
  // /대본으로 들어와도 주소는 그대로 두고 같은 페이지를 보여 주고, 예전 주소 /admin은 /대본으로 보낸다
  async rewrites() {
    // 브라우저는 한글 경로를 퍼센트 인코딩해서 보내므로 인코딩된 형태로 맞춘다
    return [{ source: `/${encodeURIComponent("대본")}`, destination: "/script" }];
  },
  async redirects() {
    return [{ source: "/admin", destination: `/${encodeURIComponent("대본")}`, permanent: true }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 대본 페이지는 /presenter. 예전 주소도 그리로 보낸다
  async redirects() {
    return [
      { source: "/admin", destination: "/presenter", permanent: true },
      { source: "/script", destination: "/presenter", permanent: true },
    ];
  },
};

export default nextConfig;

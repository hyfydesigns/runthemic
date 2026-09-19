/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  webpack: (config) => {
    // konva (used only client-side for the flyer canvas) has a Node/SSR
    // build path that pulls in the optional native `canvas` package, which
    // we don't install — stub it out since it's never actually reached.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

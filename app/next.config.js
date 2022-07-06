const { InjectManifest } = require("workbox-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new InjectManifest({
          swSrc: "./service_workers/file_writer_sw.ts",
          swDest: "../public/file_writer_sw.js",
          include: ["__nothing__"],
        })
      );
    }

    return config;
  }
};

module.exports = nextConfig;

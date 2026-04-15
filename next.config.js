/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages 部署配置
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

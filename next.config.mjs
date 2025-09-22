/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/employee',
        destination: '/employee/attendance',
        permanent: false,
      },
      {
        source: '/employee/dashboard',
        destination: '/employee/attendance',
        permanent: false,
      },
      {
        source: '/employee/reports',
        destination: '/employee/payroll',
        permanent: false,
      },
    ]
  },
}

export default nextConfig

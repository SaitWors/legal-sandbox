import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "http://localhost/", lastModified: now, priority: 1 },
    { url: "http://localhost/legal", lastModified: now, priority: 0.8 },
  ];
}

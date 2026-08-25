"use client";

import Image, { ImageProps } from "next/image";

/**
 * SmartImage automatically handles external domains and blob preview URLs
 * by setting unoptimized={true}.
 * This prevents runtime errors and app crashes when using dynamic external images.
 */
export function SmartImage({ src, unoptimized, alt, ...props }: ImageProps & { alt?: string }) {
  const isExternalOrBlob = typeof src === "string" && (
    src.startsWith("http://") || 
    src.startsWith("https://") || 
    src.startsWith("blob:") ||
    src.startsWith("data:")
  );

  return (
    <Image
      src={src}
      alt={alt || ""}
      {...props}
      unoptimized={unoptimized ?? isExternalOrBlob}
    />
  );
}

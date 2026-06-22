"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type CardImageProps = Omit<ImageProps, "onError"> & {
  fallbackLabel?: string;
};

export function CardImage({ src, alt, className, style, fallbackLabel, ...props }: CardImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-200 text-gray-500 ${className ?? ""}`}
        style={style}
      >
        <span className="px-2 text-center text-xs">{fallbackLabel ?? alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      {...props}
    />
  );
}

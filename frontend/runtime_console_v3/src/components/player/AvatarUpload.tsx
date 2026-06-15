"use client";

import { Input } from "@/components/ui/input";

type Props = {
  currentUrl?: string;
  onUpload?: (url: string) => void;
};

export function AvatarUpload({ currentUrl, onUpload }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-700">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl text-luxury-mist">👤</span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <label htmlFor="avatar-url" className="text-sm font-medium text-luxury-frost/90">
          URL da foto
        </label>
        <Input
          id="avatar-url"
          type="url"
          defaultValue={currentUrl ?? ""}
          placeholder="https://..."
          onChange={(e) => onUpload?.(e.target.value)}
          className="border-white/10 bg-white/5"
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useCreatePost } from "@/hooks/useCommunityPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { showToast } from "@/lib/toast";

type Props = {
  defaultCommunityId?: string;
  onCreated?: (postId: string) => void;
};

export function CreatePostModal({ defaultCommunityId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [communityId, setCommunityId] = useState(defaultCommunityId ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const { data: communities = [] } = useCommunities();
  const create = useCreatePost();

  const submit = async () => {
    if (!communityId || !title.trim()) return;
    try {
      const post = await create.mutateAsync({
        community_id: communityId,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
      });
      showToast("Post publicado!", "success");
      setOpen(false);
      setTitle("");
      setContent("");
      setImageUrl(undefined);
      onCreated?.(post.id);
    } catch {
      showToast("Não foi possível publicar", "error");
    }
  };

  if (!open) {
    return (
      <Button className="bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold-light" onClick={() => setOpen(true)}>
        Criar post
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="luxury-card w-full max-w-lg rounded-2xl p-6">
        <h2 className="text-xl font-light text-luxury-frost">Novo post</h2>
        <div className="mt-4 space-y-3">
          {!defaultCommunityId && (
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="luxury-input w-full"
            >
              <option value="">Selecione a comunidade</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <Input
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-white/10 bg-white/5"
          />
          <textarea
            placeholder="Conteúdo (markdown simples)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="luxury-input"
          />
          <ImageUpload label="Imagem (opcional)" onUpload={setImageUrl} previewUrl={imageUrl} />
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1 border-white/10" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-luxury-gold text-luxury-onyx"
            disabled={!communityId || !title.trim() || create.isPending}
            onClick={() => void submit()}
          >
            {create.isPending ? "Publicando…" : "Publicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

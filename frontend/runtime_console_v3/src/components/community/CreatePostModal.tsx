"use client";

import { useRef, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useCreatePost } from "@/hooks/useCommunityPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommunityImageUpload } from "@/components/community/CommunityImageUpload";
import { MarkdownToolbar } from "@/components/community/MarkdownToolbar";
import { TagInput } from "@/components/community/TagInput";
import { renderSimpleMarkdown } from "@/lib/markdown";
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
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: communities = [] } = useCommunities();
  const create = useCreatePost();

  const addImage = (url: string) => {
    if (images.length >= 4) {
      showToast("Máximo de 4 imagens", "error");
      return;
    }
    setImages((prev) => [...prev, url]);
  };

  const submit = async () => {
    if (!communityId || !title.trim()) return;
    try {
      const post = await create.mutateAsync({
        community_id: communityId,
        title: title.trim(),
        content: content.trim(),
        image_urls: images,
        tags,
      });
      showToast("Post publicado!", "success");
      setOpen(false);
      setTitle("");
      setContent("");
      setTags([]);
      setImages([]);
      onCreated?.(post.id);
    } catch {
      showToast("Não foi possível publicar", "error");
    }
  };

  if (!open) {
    return (
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90-light" onClick={() => setOpen(true)}>
        Criar post
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="surface-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
        <h2 className="text-xl font-light text-foreground">Novo post</h2>
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
            className="border-border bg-muted/50"
          />
          <TagInput tags={tags} onChange={setTags} />
          <div>
            <MarkdownToolbar value={content} onChange={setContent} textareaRef={textareaRef} />
            <textarea
              ref={textareaRef}
              placeholder="Conteúdo (markdown)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="luxury-input w-full rounded-t-none"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <button type="button" className={preview ? "text-muted-foreground" : "text-primary"} onClick={() => setPreview(false)}>
              Editar
            </button>
            <button type="button" className={preview ? "text-primary" : "text-muted-foreground"} onClick={() => setPreview(true)}>
              Preview
            </button>
          </div>
          {preview && (
            <div
              className="surface-card rounded-lg p-3 text-sm"
              dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(content) }}
            />
          )}
          {images.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="max-h-32 rounded-lg" />
              <button
                type="button"
                className="absolute right-2 top-2 rounded bg-foreground/50 px-2 text-xs"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
              >
                Remover
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <CommunityImageUpload label={`Imagem ${images.length + 1}/4 (opcional)`} onUpload={addImage} />
          )}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1 border-border" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground"
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

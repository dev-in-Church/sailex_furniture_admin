"use client";

import { useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 12; // the server accepts at most 12 per product
const MAX_FILE_MB = 10;

type ImageManagerProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

const iconButton =
  "flex h-7 w-7 items-center justify-center rounded-md text-white transition-colors hover:bg-white/25 disabled:pointer-events-none disabled:opacity-40";

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const uploadReady = isCloudinaryConfigured();
  const busy = progress !== null;
  const full = images.length >= MAX_IMAGES;

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0 || busy) return;

    const issues: string[] = [];
    const valid = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        issues.push(`${file.name} isn't an image`);
        return false;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        issues.push(`${file.name} is larger than ${MAX_FILE_MB} MB`);
        return false;
      }
      return true;
    });

    const room = MAX_IMAGES - images.length;
    if (valid.length > room) {
      issues.push(`Only ${room} more image${room === 1 ? "" : "s"} fit. The extra files were skipped.`);
    }
    const batch = valid.slice(0, Math.max(room, 0));

    setProblems(issues);
    if (batch.length === 0) return;

    setProgress({ done: 0, total: batch.length });
    const uploaded: string[] = [];

    for (const file of batch) {
      try {
        const result = await uploadToCloudinary(file);
        uploaded.push(result.secure_url);
      } catch {
        issues.push(`${file.name} couldn't be uploaded`);
      }
      setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
    }

    setProblems([...issues]);
    setProgress(null);
    if (uploaded.length > 0) onChange([...images, ...uploaded]);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragOver(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setUrlError("Enter a full image link starting with http:// or https://");
      return;
    }
    if (url.length > 2000) {
      setUrlError("That link is too long");
      return;
    }
    if (images.includes(url)) {
      setUrlError("That image is already added");
      return;
    }
    if (full) {
      setUrlError(`A product can have at most ${MAX_IMAGES} images`);
      return;
    }
    setUrlError(null);
    setUrlInput("");
    onChange([...images, url]);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const makeMain = (index: number) => {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={`${image}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />

              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shadow">
                  Main
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1.5 py-1 backdrop-blur-sm">
                <div className="flex">
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => move(index, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Move image ${index + 1} earlier`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => move(index, 1)}
                    disabled={busy || index === images.length - 1}
                    aria-label={`Move image ${index + 1} later`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => makeMain(index)}
                      disabled={busy}
                      aria-label={`Make image ${index + 1} the main image`}
                      title="Make main image"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className={cn(iconButton, "hover:bg-red-500")}
                  onClick={() => onChange(images.filter((_, i) => i !== index))}
                  disabled={busy}
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploadReady ? (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-ring/50",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
            (busy || full) && "pointer-events-none opacity-60",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-sm font-medium">
                Uploading {progress.done + 1 > progress.total ? progress.total : progress.done + 1} of{" "}
                {progress.total}...
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">
                {full ? "Image limit reached" : "Drop images here or click to upload"}
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG or WebP, up to {MAX_FILE_MB} MB each. {images.length}/{MAX_IMAGES} added.
              </span>
            </>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy || full}
            onChange={(event) => {
              void uploadFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </label>
      ) : (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Image upload isn&apos;t set up yet, so paste image links below instead. To enable
          uploads, add your Cloudinary details to this app&apos;s <code>.env.local</code>.
        </p>
      )}

      {problems.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="url"
              inputMode="url"
              placeholder="Or paste an image link"
              aria-label="Image link"
              aria-invalid={urlError ? true : undefined}
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                setUrlError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addUrl();
                }
              }}
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" onClick={addUrl} disabled={busy || !urlInput.trim()}>
            Add
          </Button>
        </div>
        {urlError && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {urlError}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        The first image is the main one shown on the store. Use the arrows to reorder.
      </p>
    </div>
  );
}

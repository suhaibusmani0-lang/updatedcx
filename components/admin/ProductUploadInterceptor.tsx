"use client";

import { useEffect } from "react";

const UPLOAD_KEYS = new Set(["images", "newImages", "video"]);

function isProductMutation(url: string, method: string) {
  return /\/api\/admin\/products(?:\/[^/?]+)?(?:\?.*)?$/.test(url) && (method === "POST" || method === "PUT");
}

export default function ProductUploadInterceptor() {
  useEffect(() => {
    const marker = "__cosmoxProductUploadInterceptor";
    const browserWindow = window as unknown as Record<string, unknown>;
    if (browserWindow[marker]) return;

    const originalFetch = window.fetch.bind(window);

    const uploadFile = async (file: File, resourceType: "image" | "video", folder: string, signal?: AbortSignal) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureResponse = await originalFetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ paramsToSign: { folder, timestamp } }),
        signal,
      });

      const signatureData = await signatureResponse.json().catch(() => ({}));
      if (!signatureResponse.ok || !signatureData?.signature) {
        throw new Error(signatureData?.error || signatureData?.message || "Unable to authorize Cloudinary upload");
      }

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
      if (!cloudName || !apiKey) {
        throw new Error("Cloudinary client configuration is missing");
      }

      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("api_key", apiKey);
      uploadForm.append("timestamp", String(timestamp));
      uploadForm.append("folder", folder);
      uploadForm.append("signature", signatureData.signature);

      const uploadResponse = await originalFetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        { method: "POST", body: uploadForm, signal }
      );
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadData?.secure_url) {
        throw new Error(uploadData?.error?.message || "Cloudinary upload failed");
      }

      return {
        url: uploadData.secure_url,
        public_id: uploadData.public_id || "",
        duration: Number(uploadData.duration || 0),
        format: uploadData.format || file.type.split("/")[1] || "",
      };
    };

    const interceptedFetch: typeof window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const body = init?.body;

      if (!isProductMutation(url, method) || !(body instanceof FormData)) {
        return originalFetch(input, init);
      }

      const signal = init?.signal || undefined;
      const values: Record<string, string | boolean | number> = {};
      const sizes: string[] = [];
      const colors: string[] = [];
      const variantsRaw = body.get("variants");
      const variantFiles = new Map<number, File>();

      for (const [key, value] of body.entries()) {
        if (key.startsWith("variantImage_") && value instanceof File && value.size > 0) {
          const index = Number(key.split("_")[1]);
          if (Number.isInteger(index)) variantFiles.set(index, value);
          continue;
        }

        if (UPLOAD_KEYS.has(key) && value instanceof File && value.size > 0) {
          continue;
        }

        if (key === "sizes" && typeof value === "string") {
          sizes.push(value);
          continue;
        }
        if (key === "colors" && typeof value === "string") {
          colors.push(value);
          continue;
        }
        if (key === "deleteImages" && typeof value === "string") {
          values.deleteImages = String(values.deleteImages || "");
          values.deleteImages = [String(values.deleteImages), value].filter(Boolean).join("||");
          continue;
        }
        if (typeof value === "string") {
          values[key] = value;
        }
      }

      const uploadTasks: Promise<void>[] = [];
      const uploadedImages: Array<{ url: string; public_id: string }> = [];
      let uploadedVideo: { url: string; public_id: string; duration: number; format: string } | null = null;
      const uploadedVariantImages = new Map<number, { url: string; public_id: string }>();

      for (const value of body.getAll("images")) {
        if (value instanceof File && value.size > 0) {
          uploadTasks.push(
            uploadFile(value, "image", "products", signal).then((result) => {
              uploadedImages.push({ url: result.url, public_id: result.public_id });
            })
          );
        }
      }

      for (const value of body.getAll("newImages")) {
        if (value instanceof File && value.size > 0) {
          uploadTasks.push(
            uploadFile(value, "image", "products", signal).then((result) => {
              uploadedImages.push({ url: result.url, public_id: result.public_id });
            })
          );
        }
      }

      const video = body.get("video");
      if (video instanceof File && video.size > 0) {
        uploadTasks.push(
          uploadFile(video, "video", "products/videos", signal).then((result) => {
            if (result.duration > 30.05) throw new Error("Product video must be 30 seconds or shorter.");
            uploadedVideo = result;
          })
        );
      }

      for (const [index, file] of variantFiles.entries()) {
        uploadTasks.push(
          uploadFile(file, "image", "products/variants", signal).then((result) => {
            uploadedVariantImages.set(index, { url: result.url, public_id: result.public_id });
          })
        );
      }

      await Promise.all(uploadTasks);

      let variants: Array<Record<string, unknown>> = [];
      if (typeof variantsRaw === "string" && variantsRaw) {
        try {
          const parsed = JSON.parse(variantsRaw);
          if (Array.isArray(parsed)) variants = parsed;
        } catch {
          variants = [];
        }
      }

      variants = variants.map((variant, index) => {
        const uploaded = uploadedVariantImages.get(index);
        return uploaded ? { ...variant, image: uploaded.url, imagePublicId: uploaded.public_id } : variant;
      });

      const jsonPayload: Record<string, unknown> = {
        ...values,
        sizes,
        colors,
        variants,
      };

      if (method === "POST") {
        jsonPayload.images = uploadedImages;
      } else {
        jsonPayload.newImages = uploadedImages;
      }

      if (uploadedVideo) jsonPayload.video = uploadedVideo;

      const nextHeaders = new Headers(init?.headers || {});
      nextHeaders.set("Content-Type", "application/json");

      return originalFetch(input, {
        ...init,
        body: JSON.stringify(jsonPayload),
        headers: nextHeaders,
      });
    };

    window.fetch = interceptedFetch;
    browserWindow[marker] = true;

    return () => {
      if (browserWindow[marker]) {
        window.fetch = originalFetch;
        delete browserWindow[marker];
      }
    };
  }, []);

  return null;
}

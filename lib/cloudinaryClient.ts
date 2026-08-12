export type UploadedCloudinaryFile = {
  url: string;
  public_id: string;
  duration?: number;
  format?: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey) throw new Error("Cloudinary client configuration is missing");
  return { cloudName, apiKey };
}

export async function uploadToCloudinary(
  file: File,
  folder: string,
  resourceType: "image" | "video",
  signal?: AbortSignal,
): Promise<UploadedCloudinaryFile> {
  const { cloudName, apiKey } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  const signatureResponse = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ paramsToSign: { folder, timestamp } }),
    signal,
  });
  const signatureData = await signatureResponse.json().catch(() => ({}));
  if (!signatureResponse.ok || !signatureData?.data?.signature) {
    throw new Error(signatureData?.message || signatureData?.error || "Unable to authorize Cloudinary upload");
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", apiKey);
  uploadForm.append("timestamp", String(timestamp));
  uploadForm.append("folder", folder);
  uploadForm.append("signature", signatureData.data.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: uploadForm, signal },
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
}

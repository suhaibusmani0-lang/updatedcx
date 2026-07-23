"use client";

import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/showToast";
import { CldUploadWidget } from "next-cloudinary";
import { FiPlus } from "react-icons/fi";

const UploadMedia = ({ isMultiple = false, onUploadComplete }) => {
  const handleOnError = (error) => {
    console.error(error);
    showToast("error", error?.statusText || "Upload failed");
  };

  const handleOnQueueEnd = async (results) => {
    try {
      const files = results.info?.files || [];

      const uploadedFiles = files
        .map((file) => file.uploadInfo)
        .filter(Boolean);

      if (!uploadedFiles.length) return;

      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: uploadedFiles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.message);
        return;
      }

      showToast("success", data.message || "Media uploaded successfully.");

      if (onUploadComplete) {
        onUploadComplete(data);
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Something went wrong.");
    }
  };

  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary-signature"
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      onError={handleOnError}
      onQueuesEnd={handleOnQueueEnd}
      config={{
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      }}
      options={{
        multiple: isMultiple,
        sources: ["local", "url", "unsplash", "google_drive"],
      }}
    >
      {({ open }) => (
        <Button
          type="button"
          onClick={() => open()}
          className="flex items-center gap-2"
        >
          <FiPlus size={18} />
          Upload Media
        </Button>
      )}
    </CldUploadWidget>
  );
};

export default UploadMedia;
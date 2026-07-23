"use client";

import BreadCrumb from "../../../../components/admin/breadCrumb"; // Changed to PascalCase
import UploadMedia from "../../../../components/admin/UploadMedia";
import MediaGallery from "../../../../components/admin/MediaGallery";

export default function MediaPage() {
 

  return (
    <>
      <BreadCrumb /> {/* Changed to PascalCase */}
      <div className="space-y-6">
        <UploadMedia onUploadComplete={() => window.dispatchEvent(new Event('media-uploaded'))} />
        <MediaGallery />
      </div>
    </>
  );
}
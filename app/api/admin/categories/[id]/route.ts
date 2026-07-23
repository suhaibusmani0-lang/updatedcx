import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import CategoryModel from "@/models/Category.model";
import { v2 as cloudinary } from "cloudinary";
import { Types } from "mongoose";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to validate slug
const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 50;
};

// Helper function to validate image
const validateImage = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  
  if (file.size > maxSize) {
    return { valid: false, error: "Image size must be less than 5MB" };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Image must be JPEG, PNG, WEBP, or GIF" };
  }
  
  return { valid: true };
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return jsonRes(400, "Invalid category ID");
    }
    
    const category = await CategoryModel.findOne({
      _id: id,
      isDeleted: { $ne: true }, // Exclude soft-deleted categories
    });
    
    if (!category) {
      return jsonRes(404, "Category not found");
    }
    
    return jsonRes(200, "Category fetched", category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Failed to fetch category");
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin();
  if (deny) return deny;
  
  try {
    await connectDB();
    const { id } = await params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return jsonRes(400, "Invalid category ID");
    }
    
    const formData = await req.formData();
    
    // Extract and validate fields
    const name = formData.get("name")?.toString().trim();
    const slug = formData.get("slug")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || "";
    const imageFile = formData.get("image") as File | null;
    const parent = formData.get("parent")?.toString().trim() || "";
    const isActive = formData.get("isActive") === "true";

    // Check if category exists
    const category = await CategoryModel.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    
    if (!category) {
      return jsonRes(404, "Category not found");
    }

    // Validate name
    if (name !== undefined) {
      if (!name || name.length < 2) {
        return jsonRes(400, "Category name must be at least 2 characters");
      }
      if (name.length > 50) {
        return jsonRes(400, "Category name must be less than 50 characters");
      }
    }

    // Validate slug
    if (slug !== undefined) {
      if (!slug || !validateSlug(slug)) {
        return jsonRes(400, "Invalid slug format. Use lowercase letters, numbers, and hyphens only.");
      }
      
      // Check if slug already exists
      if (slug !== category.slug) {
        const exists = await CategoryModel.findOne({
          slug,
          isDeleted: { $ne: true },
          _id: { $ne: id },
        });
        if (exists) {
          return jsonRes(400, "Slug already exists");
        }
      }
    }

    // Handle image upload
    let imageData = category.image;
    if (imageFile && imageFile.size > 0) {
      // Validate image
      const validation = validateImage(imageFile);
      if (!validation.valid) {
        return jsonRes(400, validation.error || "Invalid image");
      }
      
      // Delete old image from Cloudinary
      if (category.image?.public_id) {
        try {
          await cloudinary.uploader.destroy(category.image.public_id);
        } catch (error) {
          console.error("Error deleting old image:", error);
          // Continue with upload even if delete fails
        }
      }
      
      // Upload new image
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: "categories",
              resource_type: "image",
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        imageData = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      } catch (error) {
        console.error("Error uploading image:", error);
        return jsonRes(500, "Failed to upload image");
      }
    }

    // Update category
    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    category.description = description;
    category.image = imageData;
    category.parent = parent || null;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    
    return jsonRes(200, "Category updated successfully", category);
  } catch (error) {
    console.error("Error updating category:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Failed to update category");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin();
  if (deny) return deny;
  
  try {
    await connectDB();
    const { id } = await params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return jsonRes(400, "Invalid category ID");
    }
    
    // Check if category exists and is not already deleted
    const category = await CategoryModel.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
    
    if (!category) {
      return jsonRes(404, "Category not found");
    }

    // Check if category has products (optional - prevent deletion if products exist)
    // You can add this check if you have a Product model
    // const productCount = await ProductModel.countDocuments({ category: params.id });
    // if (productCount > 0) {
    //   return jsonRes(400, `Cannot delete category with ${productCount} associated products`);
    // }

    // Delete image from Cloudinary
    if (category.image?.public_id) {
      try {
        await cloudinary.uploader.destroy(category.image.public_id);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        // Continue with soft delete even if image deletion fails
      }
    }

    // Soft delete (mark as deleted)
    await CategoryModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    
    return jsonRes(200, "Category moved to recycle bin");
  } catch (error) {
    console.error("Error deleting category:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Failed to delete category");
  }
}

// Optional: Restore endpoint
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin();
  if (deny) return deny;
  
  try {
    await connectDB();
    const { id } = await params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return jsonRes(400, "Invalid category ID");
    }
    
    // Restore soft-deleted category
    const category = await CategoryModel.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    
    if (!category) {
      return jsonRes(404, "Category not found or not deleted");
    }
    
    return jsonRes(200, "Category restored successfully", category);
  } catch (error) {
    console.error("Error restoring category:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Failed to restore category");
  }
}
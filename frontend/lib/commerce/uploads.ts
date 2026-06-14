import type {
  ProductImageUploadSignature,
  UploadedProductImage,
} from "../contracts";
import { ApiError } from "./api";

/**
 * Uploads an image file directly to Cloudinary using a backend-issued signed
 * upload signature, returning the asset url and key mapped to our model.
 */
export async function uploadProductImageToCloudinary(
  file: File,
  signature: ProductImageUploadSignature,
): Promise<UploadedProductImage> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    let message = `No pudimos subir la imagen (estado ${response.status}).`;

    try {
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      if (payload.error?.message) {
        message = payload.error.message;
      }
    } catch {
      // Ignore JSON parse failures and keep the default message.
    }

    throw new ApiError(message, response.status);
  }

  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
  };

  if (!payload.secure_url || !payload.public_id) {
    throw new ApiError("Respuesta inválida de Cloudinary.", 502);
  }

  return {
    assetUrl: payload.secure_url,
    assetKey: payload.public_id,
  };
}

import { Injectable } from '@nestjs/common';
import {
  CloudinarySigningProvider,
  type CreateProductImageUploadSignatureInput,
} from '../providers/cloudinary/cloudinary-signing.provider';

@Injectable()
export class MediaService {
  constructor(
    private readonly cloudinarySigningProvider: CloudinarySigningProvider,
  ) {}

  createProductImageUploadSignature(
    input: CreateProductImageUploadSignatureInput,
  ) {
    return this.cloudinarySigningProvider.createProductImageUploadSignature(
      input,
    );
  }
}

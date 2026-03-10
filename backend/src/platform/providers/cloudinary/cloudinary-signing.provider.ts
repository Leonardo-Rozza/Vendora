import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

export type CreateProductImageUploadSignatureInput = {
  productId: string;
  timestamp?: number;
};

export type ProductImageUploadSignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
};

@Injectable()
export class CloudinarySigningProvider {
  constructor(private readonly appConfigService: AppConfigService) {}

  createProductImageUploadSignature(
    input: CreateProductImageUploadSignatureInput,
  ): ProductImageUploadSignature {
    const config = this.appConfigService.requireCloudinaryConfig();
    const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
    const folder = `vendora/products/${input.productId}`;
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
      .digest('hex');

    return {
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      folder,
      timestamp,
      signature,
    };
  }
}

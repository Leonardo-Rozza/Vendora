import { Body, Controller, Post } from '@nestjs/common';
import { CreateProductImageUploadSignatureDto } from './dto/create-product-image-upload-signature.dto';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('product-images/upload-signatures')
  createProductImageUploadSignature(
    @Body() body: CreateProductImageUploadSignatureDto,
  ) {
    return this.mediaService.createProductImageUploadSignature(body);
  }
}

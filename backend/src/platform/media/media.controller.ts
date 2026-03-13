import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../../domains/auth/guards/admin-session.guard';
import { CreateProductImageUploadSignatureDto } from './dto/create-product-image-upload-signature.dto';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('product-images/upload-signatures')
  @UseGuards(AdminSessionGuard)
  createProductImageUploadSignature(
    @Body() body: CreateProductImageUploadSignatureDto,
  ) {
    return this.mediaService.createProductImageUploadSignature(body);
  }
}

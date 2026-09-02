import { BadRequestException } from '@nestjs/common';

export const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;

export function isAllowedImageMimeType(
    mimetype: string,
): boolean {
    return ALLOWED_IMAGE_MIME_TYPES.some(
        allowedType => allowedType === mimetype,
    );
}

export function getImageExtension(
    mimetype: string,
): string {
    switch (mimetype) {
        case 'image/jpeg':
            return 'jpg';

        case 'image/png':
            return 'png';

        case 'image/webp':
            return 'webp';

        default:
            throw new BadRequestException('Unsupported image type');
    }
}
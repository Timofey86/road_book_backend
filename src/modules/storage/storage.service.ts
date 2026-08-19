import {Injectable} from '@nestjs/common';
import {
    CreateBucketCommand,
    DeleteObjectCommand, GetObjectCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import {ConfigService} from "@nestjs/config";
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
    private readonly s3: S3Client
    private readonly bucket: string;
    private readonly publicS3: S3Client;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.bucket =
            this.configService.getOrThrow<string>('S3_BUCKET');

        const region =
            this.configService.getOrThrow<string>('S3_REGION');

        const forcePathStyle =
            this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true';

        const credentials = {
            accessKeyId:
                this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
            secretAccessKey:
                this.configService.getOrThrow<string>('S3_SECRET_KEY'),
        };

        this.s3 = new S3Client({
            region,
            endpoint:
                this.configService.getOrThrow<string>('S3_ENDPOINT'),
            forcePathStyle,
            credentials,
        });

        this.publicS3 = new S3Client({
            region,
            endpoint:
                this.configService.getOrThrow<string>('S3_PUBLIC_ENDPOINT'),
            forcePathStyle,
            credentials,
        });
    }


    async onModuleInit(): Promise<void> {
        if (this.configService.get<string>('NODE_ENV') === 'development') {
            await this.ensureBucketExists();
        }
    }

    private async ensureBucketExists(): Promise<void> {
        try {
            await this.s3.send(
                new HeadBucketCommand({
                    Bucket: this.bucket,
                }),
            );
        } catch {
            await this.s3.send(
                new CreateBucketCommand({
                    Bucket: this.bucket,
                }),
            );
        }
    }

    async upload(objectKey: string, buffer: Buffer, contentType: string): Promise<string> {
        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: objectKey,
                Body: buffer,
                ContentType: contentType
            })
        )
        return objectKey
    }

    async delete(objectKey: string): Promise<void> {
        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: objectKey,
            })
        )
    }

    async getSignedUrl(objectKey: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
        });

        return getSignedUrl(this.publicS3, command, {
            expiresIn: 60 * 60,
        });
    }
}

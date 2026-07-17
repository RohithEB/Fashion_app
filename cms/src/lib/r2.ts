import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config, r2Configured } from './config';

// Single R2 (S3-compatible) client, cached across HMR reloads.
const g = globalThis as unknown as { __r2?: S3Client };

function client(): S3Client {
  if (g.__r2) return g.__r2;
  g.__r2 = new S3Client({
    region: 'auto',
    endpoint: config.r2.endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  });
  return g.__r2;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4',
};

function keyFor(prefix: string, contentType: string): string {
  const ext = EXT[contentType] || 'bin';
  const rand = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  return `${prefix}/${Date.now()}-${rand}.${ext}`;
}

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

// Upload a media buffer to R2 and return its public URL.
export async function uploadToR2(
  buffer: Buffer,
  contentType: string,
  prefix = 'products',
): Promise<UploadResult> {
  if (!r2Configured()) throw new Error('R2 is not configured — set the R2_* env vars.');
  const key = keyFor(prefix, contentType);
  await client().send(
    new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return {
    key,
    url: `${config.r2.publicUrl}/${key}`,
    contentType,
    size: buffer.length,
  };
}

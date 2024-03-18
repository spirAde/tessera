/* istanbul ignore file */

// eslint-disable-next-line import/named
import { lookup } from 'mime-types';
import { Client, ItemBucketMetadata } from 'minio';

import { minioConfig, projectSysName } from '../config';
import { logger } from '../lib/logger';

const minioSdk = new Client({
  ...minioConfig,
  useSSL: false,
});

const bucketName = projectSysName.toLowerCase();

export async function ensureS3BucketExists(): Promise<void> {
  try {
    const bucketExists = await minioSdk.bucketExists(bucketName);

    if (!bucketExists) {
      await minioSdk.makeBucket(bucketName);
    }
  } catch (error) {
    logger.error(error, '[ensureBucketExists] failed to create bucket');
    throw error;
  }
}

export async function uploadFileToS3Bucket(
  filePath: string,
  fileContent: string,
  meta: ItemBucketMetadata = {},
): Promise<void> {
  await minioSdk.putObject(bucketName, filePath, fileContent, {
    ...meta,
    'Content-Type': lookup(filePath),
  });
}

export async function removeFilesFromS3Bucket(filePaths: string[]): Promise<void> {
  await minioSdk.removeObjects(bucketName, filePaths);
}

export async function removeS3BucketFiles(): Promise<void> {
  const objects: string[] = [];

  await new Promise((resolve) => {
    minioSdk
      .listObjectsV2(bucketName, '', true)
      .on('data', (obj) => objects.push(obj.name!))
      .on('end', () => minioSdk.removeObjects(bucketName, objects).then(resolve));
  });
}

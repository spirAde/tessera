import { Client, ItemBucketMetadata } from 'minio';
import { lookup } from 'mime-types';

import { minioConfig, projectSysName, useS3BucketForStatic } from '../config';
import { logger } from '../lib/logger';

const minioSdk = new Client({
  ...minioConfig,
  useSSL: false,
});

const bucketName = projectSysName.toLowerCase();

export async function ensureS3BucketExists() {
  if (!useS3BucketForStatic) {
    return Promise.resolve();
  }

  try {
    const bucketExists = await minioSdk.bucketExists(bucketName);

    if (!bucketExists) {
      await minioSdk.makeBucket(bucketName);
    }
  } catch (error) {
    logger.debug('[ensureBucketExists] failed to create bucket');
    throw error;
  }
}

export async function uploadFileToS3Bucket(
  filePath: string,
  fileContent: string,
  meta: ItemBucketMetadata = {},
) {
  await minioSdk.putObject(bucketName, filePath, fileContent, {
    ...meta,
    'Content-Type': lookup(filePath),
  });
}

export async function removeFilesFromS3Bucket(filePaths: string[]) {
  await minioSdk.removeObjects(bucketName, filePaths);
}

export async function removeS3BucketFiles() {
  const objects: string[] = [];

  await new Promise((resolve) => {
    minioSdk
      .listObjectsV2(bucketName, '', true)
      .on('data', (obj) => objects.push(obj.name!))
      .on('end', () => minioSdk.removeObjects(bucketName, objects).then(resolve));
  });
}

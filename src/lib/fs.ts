import { stat } from 'fs/promises';

export async function isFileSystemObjectExist(fileSystemObjectPath: string) {
  try {
    await stat(fileSystemObjectPath);
    return true;
  } catch (error) {
    return false;
  }
}

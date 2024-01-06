import { readdirSync, statSync } from 'fs';
import path from 'path';

export function isFileSystemObjectExist(fileSystemObjectPath: string) {
  try {
    return Boolean(statSync(fileSystemObjectPath));
  } catch (error) {
    return false;
  }
}

function prependPathSegment(pathSegment: string) {
  return function inner(location: string) {
    return path.join(pathSegment, location);
  };
}

function readdirPreserveRelativePath(location: string) {
  return readdirSync(location).map(prependPathSegment(location));
}

function readdirRecursiveHelper(location: string): string[] {
  return readdirPreserveRelativePath(location).reduce<string[]>(
    (result, currentValue) =>
      statSync(currentValue).isDirectory()
        ? result.concat(readdirRecursiveHelper(currentValue))
        : result.concat(currentValue),
    [],
  );
}

export function readdirRecursive(location: string): string[] {
  return readdirRecursiveHelper(location).map((filePath) => filePath.replace(`${location}/`, ''));
}

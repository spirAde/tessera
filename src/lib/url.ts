export function getPageFolderPathFromUrl(url: string) {
  if (url === '/') {
    return '';
  }

  return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
}

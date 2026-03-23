/**
 * Checks if an image source string is a local blob or data URL.
 * @param src The image source string.
 * @returns True if the source is local, false otherwise.
 */
export const isLocalSrc = (src: string): boolean => {
  return src.startsWith('blob:') || src.startsWith('data:');
}; 
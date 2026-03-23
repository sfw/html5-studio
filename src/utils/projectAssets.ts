export const getProjectAssetUrl = (
  projectId: string,
  fileName: string
): string => {
  return `/assets/${projectId}/assets/${fileName}`;
};

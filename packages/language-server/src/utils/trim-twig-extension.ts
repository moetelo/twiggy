const reTwigExtension = /\.twig$/i;

export function trimTwigExtension(path: string): string {
  return path.replace(reTwigExtension, '');
}

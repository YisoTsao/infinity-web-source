/**
 * Prefix for files in /public. GitHub Pages serves this site under /<repo>/,
 * and next/image (unoptimized), canvas frames and CSS url() do not add basePath themselves.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
export const asset = (path: string) => `${BASE_PATH}${path}`

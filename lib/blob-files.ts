// Uploaded resume PDFs live in Vercel Blob, outside the database, so deleting
// rows doesn't remove them. Call this alongside any delete of resumes.
import { del } from "@vercel/blob";

export async function deleteUploadedFiles(urls: (string | null | undefined)[]): Promise<void> {
  const files = urls.filter((u): u is string => Boolean(u));
  if (files.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(files);
}

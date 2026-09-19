// Resizes/compresses a user-uploaded image client-side before it's stored
// (as a data URL, in the flyer's JSON config — there's no object storage in
// this app yet) so a phone photo doesn't balloon into several megabytes of
// base64 text in the database.
export async function resizeImageToDataUrl(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Uploads a feedback image to Cloudinary and returns the secure URL.
 */
export async function uploadFeedbackAttachment(
  file: Blob | { uri: string; name: string; type: string }
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file as Blob);
  formData.append('upload_preset', 'GatePass_Feedback');

  const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dcozenahn/image/upload', {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const uploadData = (await uploadRes.json()) as { secure_url?: string };
  if (!uploadData.secure_url) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  return uploadData.secure_url;
}

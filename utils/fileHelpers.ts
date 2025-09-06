// Helper function to convert Blob to Base64 (for sending files to backend)
export const blobToBase64 = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result as string;
			// Remove the prefix "data:*/*;base64," if needed
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["png", "jpg", "jpeg", "webp", "heic", "heif"]; // These are the supported image types by Gemini
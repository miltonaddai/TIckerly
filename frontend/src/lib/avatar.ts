const MAX_EDGE = 256;
const JPEG_QUALITY = 0.82;

export function readProfilePhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choose a JPG, PNG, or WebP photo."));
  }
  if (file.size > 8 * 1024 * 1024) {
    return Promise.reject(new Error("Choose a photo under 8 MB."));
  }

  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = MAX_EDGE;
      canvas.height = MAX_EDGE;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read that photo."));
        return;
      }
      const scale = Math.max(MAX_EDGE / image.width, MAX_EDGE / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (MAX_EDGE - width) / 2, (MAX_EDGE - height) / 2, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that photo."));
    };
    image.src = objectUrl;
  });
}

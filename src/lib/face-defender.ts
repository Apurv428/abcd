/**
 * FaceDefender™ — Privacy-first face anonymization
 * Uses the browser FaceDetector API to locate the face, then pixelates
 * the eye region. Falls back to a heuristic if FaceDetector is unavailable.
 */
export async function applyFaceDefender(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Try to detect the face using the browser FaceDetector API
        let eyeRegion = await detectEyeRegion(img);

        if (!eyeRegion) {
          // Fallback: assume upper-third of the image is the eye area
          eyeRegion = {
            x: 0,
            y: Math.floor(img.height * 0.18),
            width: img.width,
            height: Math.floor(img.height * 0.22),
          };
        }

        const { x, y, width, height } = eyeRegion;
        const blockSize = Math.max(Math.floor(width / 12), 6);

        // Pixelate the eye region
        const regionData = ctx.getImageData(x, y, width, height);
        for (let py = 0; py < height; py += blockSize) {
          for (let px = 0; px < width; px += blockSize) {
            const sampleX = Math.min(px, width - 1);
            const sampleY = Math.min(py, height - 1);
            const i = (sampleY * width + sampleX) * 4;
            const r = regionData.data[i];
            const g = regionData.data[i + 1];
            const b = regionData.data[i + 2];
            for (let dy = 0; dy < blockSize && py + dy < height; dy++) {
              for (let dx = 0; dx < blockSize && px + dx < width; dx++) {
                const fi = ((py + dy) * width + (px + dx)) * 4;
                regionData.data[fi] = r;
                regionData.data[fi + 1] = g;
                regionData.data[fi + 2] = b;
              }
            }
          }
        }
        ctx.putImageData(regionData, x, y);

        // Teal gradient overlay on the eye region
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, "rgba(45, 212, 191, 0.28)");
        gradient.addColorStop(0.5, "rgba(45, 212, 191, 0.18)");
        gradient.addColorStop(1, "rgba(45, 212, 191, 0.28)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Rounded border around masked area
        ctx.strokeStyle = "rgba(45, 212, 191, 0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, width - 2, height - 2, 8);
        ctx.stroke();

        // Label
        const fontSize = Math.max(Math.floor(width * 0.07), 11);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🛡 FaceDefender™", x + width / 2, y + height / 2);

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

/**
 * Use the browser's FaceDetector API to find the face bounding box,
 * then return the estimated eye region (upper ~35% of the face box).
 * Returns null if FaceDetector is not available or no face is found.
 */
async function detectEyeRegion(
  img: HTMLImageElement
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  try {
    // Check if FaceDetector is available (Chrome/Edge)
    if (!("FaceDetector" in window)) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (window as any).FaceDetector({ maxDetectedFaces: 1 });
    const faces = await detector.detect(img);

    if (!faces || faces.length === 0) return null;

    const face = faces[0].boundingBox;

    // The eye region is roughly the upper 20%-55% of the face bounding box
    // with a small horizontal padding
    const eyeY = face.y + face.height * 0.20;
    const eyeHeight = face.height * 0.35;
    const padX = face.width * 0.05;

    return {
      x: Math.max(0, Math.floor(face.x - padX)),
      y: Math.max(0, Math.floor(eyeY)),
      width: Math.min(Math.floor(face.width + padX * 2), img.width),
      height: Math.floor(eyeHeight),
    };
  } catch {
    return null;
  }
}

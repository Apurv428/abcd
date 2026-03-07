/**
 * FaceDefender — Privacy mask for face images.
 * Draws a gradient mask over the upper-third (eye region) of the image
 * using canvas, without requiring any ML model.
 */
export async function applyFaceDefender(imageDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas not supported"));

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Calculate eye region (upper third of image, roughly where eyes are)
            const maskY = Math.floor(img.height * 0.2);
            const maskHeight = Math.floor(img.height * 0.2);

            // Apply pixelation / blur mask over eye region
            const maskWidth = img.width;
            const pixelSize = Math.max(12, Math.floor(img.width / 20));

            // Get eye region pixel data
            const imageData = ctx.getImageData(0, maskY, maskWidth, maskHeight);
            const data = imageData.data;

            // Pixelate the eye region
            for (let y = 0; y < maskHeight; y += pixelSize) {
                for (let x = 0; x < maskWidth; x += pixelSize) {
                    const idx = (y * maskWidth + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];

                    // Fill the pixel block
                    for (let dy = 0; dy < pixelSize && y + dy < maskHeight; dy++) {
                        for (let dx = 0; dx < pixelSize && x + dx < maskWidth; dx++) {
                            const i = ((y + dy) * maskWidth + (x + dx)) * 4;
                            data[i] = r;
                            data[i + 1] = g;
                            data[i + 2] = b;
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, maskY);

            // Draw a semi-transparent gradient overlay for cleaner look
            const gradient = ctx.createLinearGradient(0, maskY, 0, maskY + maskHeight);
            gradient.addColorStop(0, "rgba(168, 85, 247, 0.0)");
            gradient.addColorStop(0.3, "rgba(168, 85, 247, 0.25)");
            gradient.addColorStop(0.7, "rgba(168, 85, 247, 0.25)");
            gradient.addColorStop(1, "rgba(168, 85, 247, 0.0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, maskY, maskWidth, maskHeight);

            // Add "MASKED" label
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.font = `${Math.floor(maskHeight * 0.35)}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("🛡️ FaceDefender", maskWidth / 2, maskY + maskHeight / 2 + 5);

            resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageDataUrl;
    });
}

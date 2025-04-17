export const registerFace = async (name, images) => {
  const formData = new FormData();
  formData.append("name", name);

  // Conversion des DataURL en Blobs
  for (const img of images) {
    const blob = await fetch(img.data).then(r => r.blob());
    formData.append("images", blob, `face_${Date.now()}.jpg`);
  }

  const response = await fetch("http://localhost:8000/register-face", {
    method: "POST",
    body: formData,
  });

  return await response.json();
};
export const detectFaces = async (imageBlob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'frame.jpg');

  try {
      const response = await fetch('http://localhost:8000/detect', {
          method: 'POST',
          body: formData
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
  } catch (error) {
      console.error('Detection error:', error);
      throw error;
  }
};
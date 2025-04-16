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
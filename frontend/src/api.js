// Test API de base
export const testBackendConnection = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/detect', {
      method: 'POST',
      body: JSON.stringify({ test: "connection" }),
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  } catch (error) {
    console.error("Erreur de connexion au backend:", error);
    return { status: "error", message: "Backend non disponible" };
  }
};
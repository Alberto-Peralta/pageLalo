async function fetchReadings(prompt) {
  try {
    const response = await fetch("/.netlify/functions/magisterium-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log("Lecturas:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener las lecturas:", error.message);
    return null;
  }
}

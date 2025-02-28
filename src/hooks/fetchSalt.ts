export async function fetchSalt(email: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/sendSalt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch salt");
    }

    const data = await response.json();
    return data.salt;
  } catch (error) {
    console.error("Error fetching salt:", error);
    return null;
  }
}

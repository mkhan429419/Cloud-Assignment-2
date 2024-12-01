"use client";

import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setImage(null);

    try {
      const response = await fetch(
        "https://vertex-image-generator-976986377870.asia-east1.run.app/api/generate-image", // Cloud Run API URL
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setImage(`data:image/png;base64,${data.image}`);
      } else {
        setError(data.error || "Failed to generate image.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-animation">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h1 className="text-4xl font-extrabold text-pink-600 mb-6 text-center">
          Text-to-Image Generator
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Enter a prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border-2 border-pink-300 rounded-lg p-3 mb-4 w-full focus:ring focus:ring-pink-200 focus:outline-none text-gray-600"
          />
          <button
            type="submit"
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </form>
        {error && (
          <p className="text-red-700 font-medium mt-4 text-center">{error}</p>
        )}
        {image && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
              Generated Image:
            </h2>
            <img
              src={image}
              alt="Generated"
              className="max-w-full rounded-lg shadow-lg mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}

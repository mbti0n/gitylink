
"use client";

import { useState } from "react";
import { generateLinkedInPost } from "@/lib/api";

export default function PostGenerator() {
  const [post, setPost] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);

    try {
      const data = await generateLinkedInPost();
      setPost(data.post);
    } catch (error) {
      console.error(error);
      alert("Failed to generate post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate LinkedIn Post"}
      </button>

      {post && (
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          className="w-full h-64 p-4 border rounded text-black bg-white"
        />
      )}
    </div>
  );
}


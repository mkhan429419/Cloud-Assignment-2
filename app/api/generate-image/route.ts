import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import path from "path";
import fs from "fs";

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins or replace with your domain
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  // Handle preflight requests
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, height = 512, width = 512, steps = 25, scale = 7.5 } = body;

    if (!text) {
      return new NextResponse(
        JSON.stringify({ error: "Text prompt is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Ensure the access key file exists
    const keyFilePath = path.resolve(process.cwd(), "access-key.json");
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found at ${keyFilePath}`);
    }

    // Google Cloud Authentication
    const auth = new GoogleAuth({
      keyFilename: keyFilePath,
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const client = await auth.getClient();

    // Vertex AI Endpoint URL
    const endpointUrl = `https://${process.env.GOOGLE_REGION}-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/${process.env.GOOGLE_REGION}/endpoints/${process.env.GOOGLE_ENDPOINT_ID}:predict`;

    console.log("Vertex AI Endpoint URL:", endpointUrl);

    // Prepare the request payload
    const payload = {
      instances: [{ text }],
      parameters: {
        height,
        width,
        num_inference_steps: steps,
        guidance_scale: scale,
      },
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Get the access token
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new Error("Failed to retrieve access token.");
    }
    console.log("Access Token:", token);

    // Make the API request
    const response = await axios.post(endpointUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Return the generated image
    const predictions = response.data.predictions;
    if (predictions && predictions.length > 0) {
      return new NextResponse(
        JSON.stringify({ image: predictions[0].output }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: "No predictions received." }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate image." }),
      { status: 500, headers: corsHeaders }
    );
  }
}

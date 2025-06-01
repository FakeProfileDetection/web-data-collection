import { createClient } from "@supabase/supabase-js";
import Busboy from "busboy";

/* ------------------------------------------------------------------ */
/* 1. Supabase client                                                 */
/* ------------------------------------------------------------------ */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ------------------------------------------------------------------ */
/* 2.  CORS helpers                                                   */
/* ------------------------------------------------------------------ */
const ALLOW_ORIGIN = "https://fakeprofiledetection.github.io"; // change / add as needed

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400", // cache preflight 24 h
};

/* ------------------------------------------------------------------ */
/* 3.  Function handler                                               */
/* ------------------------------------------------------------------ */
export const handler = async (event) => {
  const { httpMethod } = event;

  /* ---- 3.1  CORS pre‑flight -------------------------------------- */
  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  /* ---- 3.2  block everything but POST ---------------------------- */
  if (httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: "Only POST allowed",
    };
  }

  return new Promise((resolve, reject) => {
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"] || "";

    let busboy;
    try {
      busboy = Busboy({ headers: { "content-type": contentType } });
    } catch (err) {
      console.error("Busboy instantiation error:", err);
      resolve({
        statusCode: 400, // Bad Request
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid Content-Type header or Busboy instantiation failed." }),
      });
      return;
    }

    let fileData = null;
    let fileName = `upload-${Date.now()}`; // Default filename
    let fileBuffer = Buffer.alloc(0);

    busboy.on("file", (fieldname, file, info) => {
      const { filename: clientProvidedName, encoding, mimeType } = info;
      // Use clientProvidedName only if it's a non-empty string
      if (clientProvidedName && clientProvidedName.trim() !== "") {
        fileName = clientProvidedName;
      }
      // Note: fileName already has a default value like `upload-${Date.now()}`

      file.on("data", (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });

      file.on("end", () => {
        console.log(`File [${fileName}] Finished`);
      });
    });

    busboy.on("field", (fieldname, val) => {
      console.log(`Field [${fieldname}]: value: ${val}`);
    });

    busboy.on("finish", async () => {
      console.log("Busboy finished parsing form!");
      if (!fileBuffer || fileBuffer.length === 0) {
        console.error("No file data received");
        resolve({
          statusCode: 400, // Bad Request
          headers: corsHeaders,
          body: JSON.stringify({ error: "No file data received or file is empty." }),
        });
        return;
      }

      try {
        /* ---- 3.4  upload to Supabase Storage ------------------------- */
        const { error } = await supabase.storage
          .from("data-collection-files")
          .upload(`uploads/${fileName}`, fileBuffer, { upsert: true });

        if (error) throw error;

        /* ---- 3.5  public URL to return ------------------------------- */
        const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/data-collection-files/uploads/${fileName}`;

        resolve({
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ url }),
        });
      } catch (err) {
        console.error("Supabase upload or other error after parsing:", err);
        resolve({
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: err.message || "Internal server error during file upload." }),
        });
      }
    });

    busboy.on("error", err => {
        console.error('Busboy error:', err);
        resolve({
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Error parsing form data.' }),
        });
    });

    // Pipe the base64 decoded body to busboy
    try {
        const bodyBuffer = Buffer.from(event.body, "base64");
        busboy.end(bodyBuffer);
    } catch (err) {
        console.error("Error processing event body for Busboy:", err);
        resolve({
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Invalid request body." }),
        });
    }
  });
};

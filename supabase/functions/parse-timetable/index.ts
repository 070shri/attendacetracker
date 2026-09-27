// supabase/functions/parse-timetable/index.ts
//
// Parses a photo or screenshot of a weekly timetable and returns
// structured JSON containing weekday, subject, type, start_time, end_time.
//
// Deploy:
//   supabase functions deploy parse-timetable
//
// Set secrets:
//   supabase secrets set ANTHROPIC_API_KEY=your-api-key
//
// Optional model override:
//   supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-20250514

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_TYPES = ["Theory", "Practical", "Tutorial"];

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_BASE64_LEN = 7_000_000;

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `
You read photos or screenshots of weekly college or school timetables
and convert them into structured JSON.

Rules:
- Only extract Monday to Friday.
- Ignore Saturday, Sunday, breaks, and lunch rows.
- weekday: Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4.
- type: "Practical" for labs/practicals, "Tutorial" for tutorials,
  otherwise "Theory".
- start_time and end_time must use 24-hour "HH:MM" format.
- Keep subject names short.
- Drop room numbers and teacher initials unless that is all there is.
- Do not invent missing information.
- Output ONLY a raw JSON array.
- Do not include markdown fences or commentary.

Required shape:
[
  {
    "weekday": 0,
    "subject": "Physics",
    "type": "Theory",
    "start_time": "09:00",
    "end_time": "10:00"
  }
]

If you cannot find a readable timetable in the image, output [].
`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function isValidTime(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  return match !== null;
}

function isValidSlot(slot: any): boolean {
  return (
    slot !== null &&
    typeof slot === "object" &&
    Number.isInteger(slot.weekday) &&
    slot.weekday >= 0 &&
    slot.weekday <= 4 &&
    typeof slot.subject === "string" &&
    slot.subject.trim().length > 0 &&
    isValidTime(slot.start_time) &&
    isValidTime(slot.end_time)
  );
}

function cleanSlot(slot: any) {
  return {
    weekday: slot.weekday,
    subject: slot.subject.trim().slice(0, 80),
    type: VALID_TYPES.includes(slot.type) ? slot.type : "Theory",
    start_time: slot.start_time,
    end_time: slot.end_time,
  };
}

Deno.serve(async (req: Request) => {
  // Handle browser CORS preflight requests.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: CORS_HEADERS,
    });
  }

  // Only allow POST requests.
  if (req.method !== "POST") {
    return json(
      { error: "Method not allowed. Use POST." },
      405,
    );
  }

  try {
    // Parse request body.
    let body: any;

    try {
      body = await req.json();
    } catch {
      return json(
        { error: "Invalid JSON request body." },
        400,
      );
    }

    const { image, mimeType } = body ?? {};

    // Validate image.
    if (
      typeof image !== "string" ||
      image.length === 0 ||
      typeof mimeType !== "string"
    ) {
      return json(
        { error: "Missing image or mimeType." },
        400,
      );
    }

    // Validate MIME type.
    if (!ALLOWED_MIME.includes(mimeType)) {
      return json(
        {
          error:
            "Unsupported image type. Use JPEG, PNG, WEBP, or GIF.",
        },
        400,
      );
    }

    // Validate base64 size.
    if (image.length > MAX_BASE64_LEN) {
      return json(
        {
          error:
            "That image is too large. Try a smaller photo or a tighter crop.",
        },
        400,
      );
    }

    // Validate base64 format.
    const base64Pattern =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

    if (!base64Pattern.test(image)) {
      return json(
        { error: "Invalid base64 image data." },
        400,
      );
    }

    // Load Anthropic API key.
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not configured.");

      return json(
        {
          error:
            "Server is missing ANTHROPIC_API_KEY. Configure it in Supabase secrets.",
        },
        500,
      );
    }

    // Select model.
    const model =
      Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL;

    // Call Anthropic API.
    const anthropicRes = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: image,
                  },
                },
                {
                  type: "text",
                  text:
                    "Extract this weekly timetable as the JSON array described in your instructions.",
                },
              ],
            },
          ],
        }),
      },
    );

    // Handle Anthropic API errors.
    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();

      console.error(
        "Anthropic API error:",
        anthropicRes.status,
        errorText,
      );

      if (anthropicRes.status === 401) {
        return json(
          {
            error:
              "Anthropic API authentication failed. Check your ANTHROPIC_API_KEY.",
          },
          502,
        );
      }

      if (anthropicRes.status === 429) {
        return json(
          {
            error:
              "Anthropic API rate limit or usage limit reached. Please try again later.",
          },
          502,
        );
      }

      return json(
        {
          error:
            "Could not read the timetable image. Please try again.",
        },
        502,
      );
    }

    // Parse Anthropic response.
    const data = await anthropicRes.json();

    const text = (data.content ?? [])
      .filter(
        (block: any) => block.type === "text",
      )
      .map(
        (block: any) => block.text,
      )
      .join("")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Parse model output.
    let slots: unknown;

    try {
      slots = JSON.parse(text);
    } catch {
      console.error(
        "Could not parse model output:",
        text,
      );

      return json(
        {
          error:
            "Got an unreadable response while parsing the image. Try a clearer photo.",
        },
        502,
      );
    }

    // Validate response shape.
    if (!Array.isArray(slots)) {
      return json(
        {
          error:
            "Unexpected response format while parsing the timetable.",
        },
        502,
      );
    }

    // Clean and validate timetable slots.
    const cleaned = slots
      .filter(isValidSlot)
      .map(cleanSlot);

    // Return extracted timetable.
    return json({
      slots: cleaned,
    });
  } catch (err) {
    console.error("Unexpected error:", err);

    return json(
      {
        error:
          "Something went wrong while reading the timetable image.",
      },
      500,
    );
  }
});
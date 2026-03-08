import fs from "fs";
import path from "path";

// Appends one JSON line per email. In serverless production this won't persist
// across cold starts — replace with a DB write when ready.
const emailFile = path.join(process.cwd(), "emails.json");

export function saveEmail(email: string, url: string) {
  try {
    const line =
      JSON.stringify({ email, url, timestamp: new Date().toISOString() }) +
      "\n";
    fs.appendFileSync(emailFile, line);
  } catch (err) {
    console.error("Failed to save email:", err);
  }
}

// Archivo: api/datetime.js
export default function handler(req, res) {
    const now = new Date();
    res.status(200).json({
      utc: now.toUTCString(),
      iso: now.toISOString(),
      locale: now.toString(),
    });
  }
export async function GET() {
  return Response.json({
    status: "alive",
    service: "neural-ops",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
  });
}

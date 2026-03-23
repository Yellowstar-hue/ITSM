import { NextResponse } from 'next/server';

const API_ORIGIN = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  let apiStatus: 'up' | 'down' = 'down';
  let apiDetail: any = null;

  try {
    const res = await fetch(`${API_ORIGIN}/api/health/ping`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (res.ok) {
      apiStatus = 'up';
      apiDetail = await res.json().catch(() => null);
    }
  } catch {
    apiStatus = 'down';
  }

  return NextResponse.json(
    { frontend: 'ok', api: apiStatus, detail: apiDetail },
    { status: apiStatus === 'up' ? 200 : 503 }
  );
}

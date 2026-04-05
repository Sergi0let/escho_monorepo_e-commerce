import { NextResponse } from 'next/server';

function catalogApiBase(): string {
	const raw =
		[process.env.CATALOG_API_URL, process.env.INTERNAL_CATALOG_API_URL]
			.map((s) => s?.trim())
			.find((s) => s && s.length > 0) ?? 'http://127.0.0.1:4001';
	return raw.replace(/\/$/, '');
}

/**
 * Проксі на catalog-api: логіка Telegram лише на бекенді (Express).
 */
export async function POST(req: Request) {
	const body = await req.text();
	try {
		const res = await fetch(`${catalogApiBase()}/api/orders`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});
		const text = await res.text();
		return new NextResponse(text, {
			status: res.status,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (e) {
		console.error('[send-order] proxy → catalog-api:', e);
		return NextResponse.json(
			{ message: 'Не вдалося зв’язатися з сервером замовлень' },
			{ status: 502 },
		);
	}
}

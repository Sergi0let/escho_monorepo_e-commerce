import { formatUah } from "./format-uah.js";

function paymentLabel(paymentType: string): string {
  if (paymentType === "payNoCash") return "Безготівковий розрахунок";
  if (paymentType === "payAfterGetting") return "Оплата при отриманні товару";
  return paymentType;
}

/** Екранування для Telegram HTML (parse_mode HTML). */
function tgHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type OrderPayload = {
  name: string;
  lastname: string;
  phone: string;
  mail: string;
  deliveryType: string;
  deliveryCity?: string;
  deliveryAddress: string;
  paymentType: string;
  comment: string;
  items: { name: string; price: number; quantity: number }[];
  totalPrice: number;
};

export type OrderBody = {
  lastname?: string;
  name?: string;
  phone?: string;
  mail?: string;
  deliveryType?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  paymentType?: string;
  comment?: string;
  items?: { name: string; price: number; quantity: number }[];
  totalPrice?: number;
};

function buildOrderTelegramHtml(p: OrderPayload): string {
  const lines: string[] = [];

  lines.push("<b>Нове замовлення</b>");
  lines.push("");
  lines.push("<b>Контакти</b>");
  lines.push(`ПІБ: ${tgHtml(`${p.lastname} ${p.name}`)}`);
  lines.push(`Телефон: ${tgHtml(p.phone)}`);
  lines.push(`Email: ${tgHtml(p.mail || "не вказано")}`);
  lines.push("");
  lines.push("<b>Доставка</b>");
  lines.push(`Спосіб: ${tgHtml(p.deliveryType)}`);
  if (p.deliveryCity?.trim()) {
    lines.push(`Місто: ${tgHtml(p.deliveryCity.trim())}`);
  }
  lines.push(`Адреса / відділення / коментар до доставки:`);
  lines.push(tgHtml(p.deliveryAddress));
  lines.push("");
  lines.push("<b>Оплата</b>");
  lines.push(tgHtml(paymentLabel(p.paymentType)));
  lines.push("");
  lines.push("<b>Товари</b>");
  p.items.forEach((item, idx) => {
    const lineSum = item.price * item.quantity;
    lines.push(
      `${idx + 1}. ${tgHtml(item.name)}`,
      `   ${item.quantity} × ${tgHtml(formatUah(item.price))} → ${tgHtml(formatUah(lineSum))}`,
    );
  });
  lines.push("");
  lines.push(`<b>Разом: ${tgHtml(formatUah(p.totalPrice))}</b>`);
  if (p.comment.trim()) {
    lines.push("");
    lines.push("<b>Коментар до замовлення</b>");
    lines.push(tgHtml(p.comment.trim()));
  }

  return lines.join("\n");
}

const TELEGRAM_MAX_MESSAGE = 4096;

function chunkTelegramText(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_MESSAGE) return [text];
  const chunks: string[] = [];
  let offset = 0;
  let part = 1;
  while (offset < text.length) {
    const prefix = part > 1 ? `<i>Частина ${part}</i>\n\n` : "";
    const room = TELEGRAM_MAX_MESSAGE - prefix.length;
    chunks.push(prefix + text.slice(offset, offset + room));
    offset += room;
    part += 1;
  }
  return chunks;
}

async function telegramSendMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const json = (await res.json()) as { ok?: boolean; description?: string };
  if (!res.ok || json.ok !== true) {
    throw new Error(json.description ?? `Telegram API: HTTP ${res.status}`);
  }
}

export function getTelegramConfig(): { botToken: string; chatIds: string[] } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return { botToken, chatIds };
}

export async function sendOrderToTelegram(
  token: string,
  chatIds: string[],
  payload: OrderPayload,
): Promise<void> {
  const body = buildOrderTelegramHtml(payload);
  const chunks = chunkTelegramText(body);

  for (const chatId of chatIds) {
    for (const chunk of chunks) {
      await telegramSendMessage(token, chatId, chunk);
    }
  }
}

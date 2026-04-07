import type express from "express";
import {
  type OrderBody,
  getTelegramConfig,
  sendOrderToTelegram,
} from "../order-telegram.js";

export function registerOrderRoutes(app: express.Express): void {
  app.post("/api/orders", async (req, res) => {
    try {
      const data = req.body as OrderBody;

      const requiredFields = [
        "lastname",
        "name",
        "phone",
        "deliveryType",
        "deliveryAddress",
        "paymentType",
      ] as const;

      if (requiredFields.some((field) => !data[field]?.toString().trim())) {
        res.status(400).json({ message: "Заповніть усі обов’язкові поля" });
        return;
      }

      if (!Array.isArray(data.items) || data.items.length === 0) {
        res.status(400).json({
          message: "Кошик порожній або дані товарів не передані",
        });
        return;
      }

      const totalPrice =
        typeof data.totalPrice === "number" && Number.isFinite(data.totalPrice)
          ? data.totalPrice
          : data.items.reduce((s, i) => s + i.price * i.quantity, 0);

      const payload = {
        name: data.name!.trim(),
        lastname: data.lastname!.trim(),
        phone: data.phone!.trim(),
        mail: (data.mail ?? "").trim(),
        deliveryType: data.deliveryType!.trim(),
        deliveryCity: data.deliveryCity?.trim(),
        deliveryAddress: data.deliveryAddress!.trim(),
        paymentType: data.paymentType!.trim(),
        comment: data.comment?.trim() ?? "",
        items: data.items,
        totalPrice,
      };

      const { botToken, chatIds } = getTelegramConfig();

      if (!botToken || chatIds.length === 0) {
        console.warn(
          "[orders] Telegram не налаштовано (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
        );
        res.status(200).json({
          message:
            "Замовлення прийнято локально (demo: не задано Telegram у .env)",
          demo: true,
        });
        return;
      }

      await sendOrderToTelegram(botToken, chatIds, payload);

      res.status(200).json({ message: "Замовлення відправлено в Telegram" });
    } catch (error) {
      console.error("[orders] Telegram:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Помилка під час відправки в Telegram",
      });
    }
  });
}

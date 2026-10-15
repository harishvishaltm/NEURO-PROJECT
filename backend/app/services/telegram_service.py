"""Telegram Notification Service for Clinical Doctor Alerts."""
import logging
import os
import requests

logger = logging.getLogger("telegram_service")


def send_telegram_alert(
    word: str,
    sentence: str,
    patient_id: str = "ALS_Patient_01",
    confidence: float = 0.99,
) -> bool:
    from backend.app.config import settings

    bot_token = (settings.TELEGRAM_BOT_TOKEN or os.getenv("TELEGRAM_BOT_TOKEN", "")).strip()
    chat_id = (settings.TELEGRAM_CHAT_ID or os.getenv("TELEGRAM_CHAT_ID", "")).strip()

    if not bot_token or not chat_id:
        logger.info("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.")
        return False

    w = word.upper()
    is_critical = w in ["PAIN", "HELP", "BREATHE", "SCARED"]
    urgency_badge = "🚨 CRITICAL DOCTOR ALERT" if is_critical else "⚠️ PATIENT ASSISTANCE NEEDED"

    message_text = (
        f"{urgency_badge}\n"
        f"━━━━━━━━━━━━━━━━━━━\n"
        f"🏥 Patient: {patient_id} (Bed 4B)\n"
        f"🧠 Decoded Need: *{w}* ({confidence * 100:.1f}% confidence)\n"
        f"🗣 Spoken Speech: \"_{sentence}_\"\n"
        f"━━━━━━━━━━━━━━━━━━━\n"
        f"⚡ Status: Assistive audio delivered to room."
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown",
        "disable_notification": False,  # Always play sound on phone
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            logger.info(f"✅ Telegram alert successfully delivered to doctor phone (chat_id: {chat_id})")
            return True
        else:
            logger.warning(f"Telegram API responded with {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False

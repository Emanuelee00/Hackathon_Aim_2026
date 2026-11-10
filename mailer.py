"""Sending e-mails, set once on the server: through Resend (RESEND_API_KEY) or any SMTP server (SMTP_HOST, SMTP_PORT, SMTP_USER,
SMTP_PASSWORD, e.g. a Gmail address with an app password). Used by the funding reminders and the forms' confirmations.
Without either, nothing is sent and callers carry on."""

import json
import os
import smtplib
import urllib.request
from email.message import EmailMessage


def configured() -> bool:
    return bool(os.getenv("RESEND_API_KEY") or os.getenv("SMTP_HOST"))


def deliver(mail: EmailMessage) -> bool:
    """Sends through Resend or an SMTP server; False when no mail service is configured."""
    if key := os.getenv("RESEND_API_KEY"):
        payload = {
            "from": mail["From"],
            "to": [mail["To"]],
            "subject": mail["Subject"],
            "text": mail.get_content(),
        }
        if mail["Reply-To"]:
            payload["reply_to"] = mail["Reply-To"]
        request = urllib.request.Request(
            "https://api.resend.com/emails",
            json.dumps(payload).encode(),
            {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        )
        urllib.request.urlopen(request, timeout=20).close()
        return True
    if host := os.getenv("SMTP_HOST"):
        with smtplib.SMTP(
            host, int(os.getenv("SMTP_PORT", "587")), timeout=20
        ) as server:
            server.starttls()
            if user := os.getenv("SMTP_USER"):
                server.login(user, os.getenv("SMTP_PASSWORD", ""))
            server.send_message(mail)
        return True
    return False

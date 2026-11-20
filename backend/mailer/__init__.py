"""Sending e-mails: Resend (RESEND_API_KEY) or any SMTP server (SMTP_HOST, ...).

The module-level API is unchanged, so callers keep using `mailer.configured()`
and `mailer.deliver(...)`; `mailer.urllib` stays reachable for tests.
"""

# Re-exported: tests patch mailer.urllib.request.
import urllib.request

from .service import configured, deliver

__all__ = ["configured", "deliver", "urllib"]

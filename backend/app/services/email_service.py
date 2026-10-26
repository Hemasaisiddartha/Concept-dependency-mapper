import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp_email(recipient_email: str, otp_code: str, recipient_name: str = "") -> Dict[str, Any]:
        """
        Sends an email containing the 6-digit verification OTP code.
        Supports standard SMTP (e.g., Gmail, Outlook, AWS SES, or custom SMTP server)
        via environment variables:
          - SMTP_HOST (e.g. smtp.gmail.com)
          - SMTP_PORT (e.g. 587 or 465)
          - SMTP_USER (e.g. your_email@gmail.com)
          - SMTP_PASSWORD (e.g. app password)
          - SMTP_FROM_EMAIL (e.g. "Smart AI Concept Mapper <no-reply@conceptmapper.edu>")
          - SMTP_USE_TLS (default: True)
        
        If SMTP is not configured, logs the OTP clearly and safely returns delivery details.
        """
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user or "no-reply@conceptmapper.ai")
        smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

        greeting = f"Hello {recipient_name.strip()}," if recipient_name and recipient_name.strip() else "Hello,"
        subject = f"🔐 {otp_code} is your Concept Mapper verification code"

        plain_text = f"""{greeting}

Your One-Time Password (OTP) verification code for Smart AI Concept Dependency Mapper is:

{otp_code}

This code is valid for 10 minutes. Please enter this code on the login page to securely access your adaptive learning workspace.

If you did not request this code, you can safely ignore this email.

---
Smart AI Concept Dependency Mapper
Adaptive Prerequisite Learning Platform
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      padding: 30px 15px;
    }}
    .email-container {{
      max-width: 520px;
      margin: 0 auto;
      background: #131b2e;
      border: 1px solid #2a3756;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      padding: 24px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}
    .body {{
      padding: 32px 28px;
    }}
    .otp-card {{
      background: rgba(99, 102, 241, 0.12);
      border: 2px dashed #6366f1;
      border-radius: 12px;
      text-align: center;
      padding: 20px;
      margin: 24px 0;
    }}
    .otp-code {{
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #38bdf8;
      font-family: monospace, Courier, sans-serif;
      margin: 0;
    }}
    .badge {{
      display: inline-block;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
      font-weight: 600;
    }}
    .footer {{
      border-top: 1px solid #1e293b;
      padding: 16px 28px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      background: #0f172a;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Smart AI Concept Dependency Mapper</h1>
    </div>
    <div class="body">
      <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">{greeting}</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
        You requested a verification code to sign in to your adaptive learning workspace. Use the one-time password below to authenticate:
      </p>
      
      <div class="otp-card">
        <div class="otp-code">{otp_code}</div>
        <div class="badge">⏱️ Valid for 10 minutes &bull; Single-use only</div>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
        If you did not request this sign-in code, you can safely ignore this email. No changes will be made to your account.
      </p>
    </div>
    <div class="footer">
      Empowering mastery learning through AI-driven Directed Acyclic Graphs.
    </div>
  </div>
</body>
</html>
"""

        # Log status to console for backend administrator visibility
        print("\n=======================================================")
        print(f"[EMAIL SERVICE] REQUEST TO SEND OTP TO: {recipient_email}")
        if smtp_host and smtp_user and smtp_password:
            print(f"[EMAIL SERVICE] SMTP SERVER: {smtp_host}:{smtp_port} (User: {smtp_user})")
        else:
            print(f"[EMAIL SERVICE] [NOTICE] SMTP credentials (SMTP_USER/SMTP_PASSWORD) not configured in .env.")
            print(f"[DEBUG DEV OTP CODE] {otp_code} (Configure SMTP in backend/.env for real Gmail delivery)")
        print("=======================================================\n")

        # If SMTP is configured, attempt delivery
        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = smtp_from
                msg["To"] = recipient_email

                part1 = MIMEText(plain_text, "plain")
                part2 = MIMEText(html_content, "html")
                msg.attach(part1)
                msg.attach(part2)

                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
                        server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [recipient_email], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                        if smtp_use_tls:
                            server.starttls()
                        server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, [recipient_email], msg.as_string())

                logger.info(f"Successfully sent OTP email to {recipient_email} via SMTP")
                print(f"[EMAIL SERVICE SUCCESS] Real email dispatched to {recipient_email} via Gmail/SMTP server.")
                return {
                    "sent": True,
                    "method": "smtp"
                }
            except Exception as e:
                logger.error(f"SMTP delivery failed: {e}")
                print(f"[EMAIL SERVICE ERROR] SMTP delivery failed: {e}")
                return {
                    "sent": False,
                    "method": "smtp_failed",
                    "error": str(e)
                }

        # Otherwise development/local fallback
        return {
            "sent": False,
            "method": "local_dev_missing_smtp"
        }

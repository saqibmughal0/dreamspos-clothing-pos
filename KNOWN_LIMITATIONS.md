# DreamsPOS Known Limitations & External Integration Notes

This document explicitly identifies hardware boundaries, external vendor dependencies, and environment constraints.

## 1. Hardware Integrations

| Feature | Production Behavior | Current Implementation & Limitations |
| :--- | :--- | :--- |
| **Physical Cash Drawer Kick-out** | Sends pulse via ESC/POS command through thermal printer RJ11 connector | Web browsers cannot directly pulse hardware serial pins. Triggered via standard browser print ESC/POS commands or local desktop helper service. |
| **Barcode Scanner** | USB / Bluetooth HID barcode reader sends keystrokes with carriage return suffix | Fully supported via global keyboard wedge listener (`onKeyDown` buffer with 30ms inter-keystroke threshold). |
| **Thermal Receipt Printers** | 58mm / 80mm thermal printers printing via direct RAW socket | Supported via browser print CSS (`@media print` formatted for 58mm/80mm widths). Native ESC/POS RAW network socket requires local bridge or backend CUPS/print agent. |
| **Electronic Pole Displays / Customer Facing Display**| Dual-screen presentation or secondary display window | Supported via modern Web Multi-Screen Window Placement API (`window.open` on secondary screen). |

---

## 2. External Third-Party Services

| Service Type | Provider Options | Sandbox & Development Strategy |
| :--- | :--- | :--- |
| **SMS Gateway** | Twilio, Vonage, Infobip | Uses standardized adapter interface with Mock/Test mode logger. Real credentials can be configured in System Settings. |
| **Payment Gateways** | Stripe, PayPal, Razorpay | Integrated via official SDK test modes. Never attempts fake live transactions. |
| **Email SMTP** | SendGrid, Amazon SES, Mailgun, SMTP | Configurable via Settings; fallback to local Ethereal/nodemailer test inbox during offline development. |
| **Video & Audio Calling** | WebRTC, Agora, Twilio Video | Full UI with WebRTC local loopback demonstration; production deployment requires TURN/STUN infrastructure. |

const COMPANY = process.env.COMPANY_NAME || 'ShopEase';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'support@shopease.dev';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

module.exports = function orderConfirmationTemplate(order) {
  const itemRows = (order.items || []).map((item) => `
  <tr>
    <td style="padding:10px 0;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;">
      ${item.productName}${item.variantLabel ? `<span style="color:#94a3b8;"> — ${item.variantLabel}</span>` : ''}
      <span style="color:#94a3b8;"> × ${item.quantity}</span>
    </td>
    <td style="padding:10px 0;font-size:13px;color:#3b82f6;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9;white-space:nowrap;">
      ${formatPrice(item.price * item.quantity)}
    </td>
  </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Order #${order.orderNumber} received — we'll get started right away!</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:6px;">🛍️</div>
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${COMPANY}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Order Confirmation</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 32px;border-left:1px solid #e8edf2;border-right:1px solid #e8edf2;">

            <p style="margin:0 0 20px;font-size:16px;color:#1e293b;">Hi <strong>${order.shippingName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
              Thank you for your order! We've received it and it's now being processed.
              You'll receive an email confirmation once your payment is verified.
            </p>

            <!-- Order number badge -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;padding:14px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size:13px;color:#64748b;">Order Number</td>
                      <td style="text-align:right;font-size:15px;font-weight:800;color:#2563eb;font-family:monospace;">#${order.orderNumber}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Items -->
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${itemRows}
              <tr>
                <td style="padding-top:12px;font-size:14px;font-weight:700;color:#1e293b;">Total</td>
                <td style="padding-top:12px;font-size:15px;font-weight:800;color:#3b82f6;text-align:right;white-space:nowrap;">${formatPrice(order.totalAmount)}</td>
              </tr>
            </table>

            <div style="height:1px;background:#f1f5f9;margin:24px 0;"></div>

            <!-- Shipping -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#f8fafc;border-radius:10px;padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;">Shipping To</p>
                  <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#1e293b;">${order.shippingName}</p>
                  <p style="margin:0 0 3px;font-size:13px;color:#64748b;">${order.shippingPhone}</p>
                  <p style="margin:0;font-size:13px;color:#64748b;">${order.shippingAddress}</p>
                </td>
              </tr>
            </table>

            <div style="height:1px;background:#f1f5f9;margin:24px 0;"></div>

            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
              You'll receive another email when your payment is confirmed and when your order status is updated.<br/>
              Keep this email for your records.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e8edf2;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
              Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#3b82f6;text-decoration:none;">${SUPPORT_EMAIL}</a>
            </p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} ${COMPANY}. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
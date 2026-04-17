const COMPANY = process.env.COMPANY_NAME || 'EveryBit';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'support@everybit.dev';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

// ─── Shared layout wrapper ────────────────────────────────────
function layout({ previewText, headerGradient, headerIcon, headerTitle, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

        <!-- Header -->
        <tr>
          <td style="background:${headerGradient};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:6px;">${headerIcon}</div>
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${COMPANY}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">${headerTitle}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 32px;border-left:1px solid #e8edf2;border-right:1px solid #e8edf2;">
            ${body}
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
}

// ─── Shared sub-components ────────────────────────────────────
function greeting(name) {
  return `<p style="margin:0 0 20px;font-size:16px;color:#1e293b;">Hi <strong>${name}</strong>,</p>`;
}

function divider() {
  return `<div style="height:1px;background:#f1f5f9;margin:24px 0;"></div>`;
}

function infoRow(label, value) {
  return `
  <tr>
    <td style="padding:8px 0;font-size:13px;color:#64748b;width:42%;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#1e293b;font-weight:600;">${value}</td>
  </tr>`;
}

function sectionLabel(text) {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;">${text}</p>`;
}

function highlightBox(icon, title, subtitle, color) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background:${color}10;border:1px solid ${color}30;border-radius:12px;padding:18px 20px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:26px;padding-right:14px;vertical-align:middle;">${icon}</td>
            <td style="vertical-align:middle;">
              <div style="font-size:15px;font-weight:700;color:${color};">${title}</div>
              ${subtitle ? `<div style="font-size:13px;color:#64748b;margin-top:2px;">${subtitle}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function noteBox(note) {
  if (!note) return '';
  return `
  <div style="background:#f8fafc;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0;">
    <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;font-style:italic;">${note}</p>
  </div>`;
}

function alertBox(icon, text, bg, border, textColor) {
  return `
  <div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:14px 18px;margin:16px 0;">
    <p style="margin:0;font-size:13px;color:${textColor};line-height:1.6;">${icon} ${text}</p>
  </div>`;
}

function shippingBox(order) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
    <tr>
      <td style="background:#f8fafc;border-radius:10px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;">Shipping To</p>
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#1e293b;">${order.shippingName}</p>
        <p style="margin:0 0 3px;font-size:13px;color:#64748b;">${order.shippingPhone}</p>
        <p style="margin:0;font-size:13px;color:#64748b;">${order.shippingAddress}</p>
      </td>
    </tr>
  </table>`;
}

function itemsTable(items) {
  if (!items || items.length === 0) return '';
  const rows = items.map((item) => `
  <tr>
    <td style="padding:10px 0;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;">
      ${item.productName}${item.variantLabel ? `<span style="color:#94a3b8;"> — ${item.variantLabel}</span>` : ''}
      <span style="color:#94a3b8;"> × ${item.quantity}</span>
    </td>
    <td style="padding:10px 0;font-size:13px;color:#3b82f6;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9;white-space:nowrap;">
      ${formatPrice(item.price * item.quantity)}
    </td>
  </tr>`).join('');
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
    ${rows}
    <tr>
      <td style="padding-top:12px;font-size:14px;font-weight:700;color:#1e293b;">Total</td>
      <td style="padding-top:12px;font-size:15px;font-weight:800;color:#3b82f6;text-align:right;white-space:nowrap;">${formatPrice(total)}</td>
    </tr>
  </table>`;
}

// ─── Per-status templates ─────────────────────────────────────

function paidTemplate(order) {
  const paidAt = order.payment?.paidAt;
  const method = order.payment?.paymentMethod || 'Online Payment';
  return layout({
    previewText: `Payment confirmed for Order #${order.orderNumber} — thank you!`,
    headerGradient: 'linear-gradient(135deg,#16a34a,#15803d)',
    headerIcon: '✅',
    headerTitle: 'Payment Confirmed',
    body: `
      ${greeting(order.shippingName)}
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        We've successfully received your payment for <strong>Order #${order.orderNumber}</strong>. Thank you for your purchase!
      </p>

      ${highlightBox('💳', 'Payment Received', `Paid via ${method}`, '#16a34a')}

      ${sectionLabel('Order Summary')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow('Order Number', `#${order.orderNumber}`)}
        ${infoRow('Payment Method', method)}
        ${infoRow('Total Amount', formatPrice(order.totalAmount))}
        ${infoRow('Payment Date', formatDate(paidAt))}
      </table>

      ${divider()}

      ${sectionLabel("What's Next")}
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        We're now preparing your order and will notify you once it's packed and ready to ship.
        If you have any questions, feel free to contact us at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#3b82f6;text-decoration:none;">${SUPPORT_EMAIL}</a>.
      </p>

      ${shippingBox(order)}
    `,
  });
}

function packedTemplate(order) {
  const itemSummary = (order.items || []).map((i) => `${i.productName} × ${i.quantity}`).join(', ');
  return layout({
    previewText: `Your Order #${order.orderNumber} is packed and ready to ship!`,
    headerGradient: 'linear-gradient(135deg,#d97706,#b45309)',
    headerIcon: '📦',
    headerTitle: 'Order Packed',
    body: `
      ${greeting(order.shippingName)}
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        Good news! Your order <strong>#${order.orderNumber}</strong> has been carefully packed and is ready for shipment.
        We'll notify you as soon as your package is on its way.
      </p>

      ${highlightBox('📦', 'Packed & Ready', 'Your items are safely packed and awaiting courier pickup.', '#d97706')}

      ${sectionLabel('Order Details')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow('Order Number', `#${order.orderNumber}`)}
        ${infoRow('Items', itemSummary || '—')}
        ${infoRow('Total', formatPrice(order.totalAmount))}
      </table>

      ${divider()}

      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        Thank you for shopping with us! You'll receive another update once your order has been handed to the courier.
      </p>

      ${shippingBox(order)}
    `,
  });
}

function shippedTemplate(order, note) {
  return layout({
    previewText: `Your Order #${order.orderNumber} has shipped and is on its way!`,
    headerGradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    headerIcon: '📮',
    headerTitle: 'Order Shipped',
    body: `
      ${greeting(order.shippingName)}
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        Your order <strong>#${order.orderNumber}</strong> has been shipped and is on its way to you!
      </p>

      ${highlightBox('🚀', 'In Transit', 'Your package has been handed to the courier.', '#2563eb')}

      ${sectionLabel('Shipping Details')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow('Order Number', `#${order.orderNumber}`)}
        ${infoRow('Total', formatPrice(order.totalAmount))}
      </table>

      ${note ? `${divider()}${sectionLabel('Tracking Info')}${noteBox(note)}` : ''}

      ${divider()}

      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        You can track your package using the tracking number above.
        Let us know if you need any assistance at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#3b82f6;text-decoration:none;">${SUPPORT_EMAIL}</a>.
      </p>

      ${shippingBox(order)}
    `,
  });
}

function outForDeliveryTemplate(order) {
  return layout({
    previewText: `Your Order #${order.orderNumber} is out for delivery today!`,
    headerGradient: 'linear-gradient(135deg,#ea580c,#c2410c)',
    headerIcon: '🚚',
    headerTitle: 'Out for Delivery',
    body: `
      ${greeting(order.shippingName)}
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        Great news! Your order <strong>#${order.orderNumber}</strong> is out for delivery and will arrive <strong>today</strong>!
      </p>

      ${highlightBox('🚚', 'Arriving Today', 'Your package is with the delivery driver right now.', '#ea580c')}

      ${alertBox(
        '📍',
        'Please make sure someone is available to receive the package at the delivery address below. If you have any delivery instructions, feel free to contact us.',
        '#fff7ed',
        '#fed7aa',
        '#9a3412'
      )}

      ${shippingBox(order)}

      ${divider()}

      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        Thanks again for choosing <strong>${COMPANY}</strong>! We hope you love your order.
      </p>
    `,
  });
}

function deliveredTemplate(order) {
  return layout({
    previewText: `Your Order #${order.orderNumber} has been delivered. Enjoy!`,
    headerGradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
    headerIcon: '🎉',
    headerTitle: 'Order Delivered',
    body: `
      ${greeting(order.shippingName)}
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        We're happy to inform you that your order <strong>#${order.orderNumber}</strong> has been successfully delivered! 🎉
      </p>

      ${highlightBox('🎁', 'Enjoy Your Purchase!', 'Your package has been delivered successfully.', '#7c3aed')}

      ${sectionLabel('Items Delivered')}
      ${itemsTable(order.items)}

      ${divider()}

      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
        We hope you love what you ordered! If you have any issues or feedback, we'd love to hear from you at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#3b82f6;text-decoration:none;">${SUPPORT_EMAIL}</a>.
      </p>
      <p style="margin:0;font-size:14px;color:#94a3b8;text-align:center;">
        Thank you for shopping with us and we look forward to serving you again. 💜<br/>
        — The <strong>${COMPANY}</strong> Team
      </p>
    `,
  });
}

function failedTemplate(order, note) {
  return layout({
    previewText: `Important update on your Order #${order.orderNumber}.`,
    headerGradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    headerIcon: '❌',
    headerTitle: 'Order Failed',
    body: `
      ${greeting(order.shippingName)}
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
        We're sorry to inform you that your order <strong>#${order.orderNumber}</strong> could not be processed.
      </p>

      ${highlightBox('❌', 'Order Failed', 'There was an issue processing your order.', '#dc2626')}

      ${note ? noteBox(note) : ''}

      ${divider()}

      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        Please contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#3b82f6;text-decoration:none;">${SUPPORT_EMAIL}</a>
        if you have any questions or need assistance placing a new order.
      </p>
    `,
  });
}

// ─── Main export ──────────────────────────────────────────────
module.exports = function statusUpdateTemplate(order, status, note) {
  switch (status) {
    case 'paid':             return paidTemplate(order);
    case 'packed':           return packedTemplate(order);
    case 'shipped':          return shippedTemplate(order, note);
    case 'out_for_delivery': return outForDeliveryTemplate(order);
    case 'delivered':        return deliveredTemplate(order);
    case 'failed':           return failedTemplate(order, note);
    default:
      return layout({
        previewText: `Update on your Order #${order.orderNumber}.`,
        headerGradient: 'linear-gradient(135deg,#475569,#334155)',
        headerIcon: '🔔',
        headerTitle: 'Order Update',
        body: `
          ${greeting(order.shippingName)}
          <p style="margin:0;font-size:15px;color:#334155;">
            Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong>${status}</strong>.
          </p>
          ${note ? noteBox(note) : ''}
        `,
      });
  }
};
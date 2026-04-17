const nodemailer = require('nodemailer');
const orderConfirmationTemplate = require('../templates/orderConfirmationTemplate');
const statusUpdateTemplate = require('../templates/statusUpdateTemplate');

let transporter = null;
let testAccount = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Use real SMTP if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail =
      !process.env.SMTP_HOST || process.env.SMTP_HOST.includes('gmail');

    transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
        : {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
    );
    console.log('📧 Email: using', isGmail ? 'Gmail service' : process.env.SMTP_HOST);
    return transporter;
  }

  // Fall back to Ethereal (catches all sent emails — view at https://ethereal.email)
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('📧 Email: using Ethereal test account →', testAccount.user);
  console.log('   View sent emails at: https://ethereal.email/messages');
  return transporter;
}

async function sendMail({ to, subject, html }) {
  try {
    const t = await getTransporter();
  const from = process.env.EMAIL_FROM || 'EveryBit <noreply@everybit.dev>';
    const info = await t.sendMail({ from, to, subject, html });

    // Print Ethereal preview URL for demo
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email sent to: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Preview: ${previewUrl}`);
    } else {
      console.log(`📧 Email sent to: ${to} — Subject: ${subject}`);
    }
    return info;
  } catch (err) {
    console.error('📧 Email send failed:', err.message);
  }
}

exports.sendOrderConfirmation = async (order) => {
  if (!order.customerEmail) return;
  await sendMail({
    to: order.customerEmail,
    subject: `Order Confirmed — ${order.orderNumber} 🎉`,
    html: orderConfirmationTemplate(order),
  });
};

exports.sendStatusUpdate = async (order, newStatus, note) => {
  if (!order.customerEmail) return;
  const STATUS_LABELS = {
    paid:             'Payment Confirmed',
    packed:           'Order Packed',
    shipped:          'Order Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Order Delivered',
    failed:           'Order Failed',
  };
  const label = STATUS_LABELS[newStatus] || newStatus;
  await sendMail({
    to: order.customerEmail,
    subject: `Order Update: ${label} — ${order.orderNumber}`,
    html: statusUpdateTemplate(order, newStatus, note),
  });
};

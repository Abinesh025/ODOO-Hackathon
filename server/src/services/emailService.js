import nodemailer from 'nodemailer';

/* ------------------------------------------------------------------ */
/*  Transporter – configure via .env                                   */
/* ------------------------------------------------------------------ */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[EmailService] SMTP_USER / SMTP_PASS not set – emails disabled');
    return null;
  }

  // If no host is provided, default to Gmail SMTP
  const opts = host
    ? { host, port, secure: port === 465, auth: { user, pass } }
    : { service: 'gmail', auth: { user, pass } };

  transporter = nodemailer.createTransport(opts);
  return transporter;
}

/* ------------------------------------------------------------------ */
/*  HTML templates                                                     */
/* ------------------------------------------------------------------ */

function baseTemplate({ title, accent, icon, heading, bodyHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f14; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e0e0e0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card {
      background: linear-gradient(145deg, #1a1a24 0%, #12121a 100%);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%);
      border-bottom: 1px solid ${accent}33;
      padding: 32px 28px;
      text-align: center;
    }
    .header .icon { font-size: 48px; margin-bottom: 12px; }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: ${accent};
      letter-spacing: -0.5px;
    }
    .body-content { padding: 28px; }
    .greeting {
      font-size: 16px;
      color: #b0b0b8;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .detail-table td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .detail-table td:first-child {
      color: #787888;
      font-weight: 600;
      width: 140px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.8px;
    }
    .detail-table td:last-child { color: #e4e4ea; }
    .status-badge {
      display: inline-block;
      padding: 6px 18px;
      border-radius: 24px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: ${accent}22;
      color: ${accent};
      border: 1px solid ${accent}44;
    }
    .comment-box {
      background: rgba(255,255,255,0.03);
      border-left: 3px solid ${accent};
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 16px 0;
      font-style: italic;
      color: #a0a0aa;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      padding: 20px 28px;
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .footer p {
      font-size: 12px;
      color: #555566;
    }
    .footer .brand {
      font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #6366f1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="icon">${icon}</div>
        <h1>${heading}</h1>
      </div>
      <div class="body-content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>Powered by <span class="brand">Smart ExpenseFlow</span></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function approvedEmail({ userName, amount, currency, category, description, approverName, comment }) {
  const amountStr = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const bodyHtml = `
    <p class="greeting">Hi <strong style="color:#e4e4ea">${userName}</strong>,<br/>
    Great news! Your expense request has been <strong style="color:#34d399">approved</strong>.</p>
    <table class="detail-table">
      <tr><td>Amount</td><td><strong style="color:#34d399;font-size:18px">${currency} ${amountStr}</strong></td></tr>
      <tr><td>Category</td><td>${category}</td></tr>
      ${description ? `<tr><td>Description</td><td>${description}</td></tr>` : ''}
      <tr><td>Status</td><td><span class="status-badge">Approved</span></td></tr>
      <tr><td>Approved By</td><td>${approverName}</td></tr>
    </table>
    ${comment ? `<div class="comment-box">"${comment}"</div>` : ''}
    <p class="greeting" style="margin-top:24px">Your reimbursement will be processed as per company policy.</p>
  `;

  return baseTemplate({
    title: 'Expense Approved',
    accent: '#34d399',
    icon: '✅',
    heading: 'Expense Approved',
    bodyHtml,
  });
}

function rejectedEmail({ userName, amount, currency, category, description, approverName, comment }) {
  const amountStr = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const bodyHtml = `
    <p class="greeting">Hi <strong style="color:#e4e4ea">${userName}</strong>,<br/>
    Unfortunately, your expense request has been <strong style="color:#f87171">rejected</strong>.</p>
    <table class="detail-table">
      <tr><td>Amount</td><td><strong style="color:#f87171;font-size:18px">${currency} ${amountStr}</strong></td></tr>
      <tr><td>Category</td><td>${category}</td></tr>
      ${description ? `<tr><td>Description</td><td>${description}</td></tr>` : ''}
      <tr><td>Status</td><td><span class="status-badge">Rejected</span></td></tr>
      <tr><td>Rejected By</td><td>${approverName}</td></tr>
    </table>
    ${comment ? `<div class="comment-box">"${comment}"</div>` : ''}
    <p class="greeting" style="margin-top:24px">If you believe this was a mistake, please contact your manager or admin for clarification.</p>
  `;

  return baseTemplate({
    title: 'Expense Rejected',
    accent: '#f87171',
    icon: '❌',
    heading: 'Expense Rejected',
    bodyHtml,
  });
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Send an email notification when an expense is approved or rejected.
 *
 * @param {{ email: string, name: string }} recipient  – the expense submitter
 * @param {'approve'|'reject'} action
 * @param {{ amount: number, currency: string, category: string, description?: string }} expense
 * @param {{ name: string }} approver
 * @param {string} [comment]
 */
export async function sendExpenseDecisionEmail(recipient, action, expense, approver, comment) {
  const tp = getTransporter();
  if (!tp) return; // email not configured — silently skip

  const html =
    action === 'approve'
      ? approvedEmail({
          userName: recipient.name,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          approverName: approver.name,
          comment,
        })
      : rejectedEmail({
          userName: recipient.name,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          approverName: approver.name,
          comment,
        });

  const subject =
    action === 'approve'
      ? `✅ Expense Approved – ${expense.currency} ${Number(expense.amount).toLocaleString()}`
      : `❌ Expense Rejected – ${expense.currency} ${Number(expense.amount).toLocaleString()}`;

  try {
    await tp.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient.email,
      subject,
      html,
    });
    console.log(`[EmailService] Sent ${action} email to ${recipient.email}`);
  } catch (err) {
    // Never crash the API because of email failure
    console.error('[EmailService] Failed to send email:', err.message);
  }
}

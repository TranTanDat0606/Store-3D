import { getTransporter, isEmailEnabled } from './email.config';
import { config } from '../../config';
import { paymentSuccessTemplate } from './templates/payment-success';
import { supportReceivedTemplate } from './templates/support-received';
import { supportReplyTemplate } from './templates/support-reply';
import { contactAdminTemplate } from './templates/contact-admin';
import { contactAcknowledgementTemplate } from './templates/contact-acknowledgement';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status: 'sent' | 'failed' | 'not_configured';
}

async function sendMail(to: string, subject: string, html: string): Promise<EmailSendResult> {
  if (!isEmailEnabled()) {
    console.log(`[Email] NOT_CONFIGURED — skipping send to ${to}: ${subject}`);
    return { success: false, error: 'SMTP chưa được cấu hình', status: 'not_configured' };
  }
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: 'Không thể tạo SMTP transporter', status: 'not_configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: config.mailFrom || config.smtp.user,
      to,
      subject,
      html,
    });
    console.log(`[Email] EMAIL_SENT to=${to} subject="${subject}" messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`);
    return { success: true, messageId: info.messageId, status: 'sent' };
  } catch (err) {
    const safeError = (err as Error).message || 'Unknown error';
    console.error(`[Email] EMAIL_SEND_FAILED to=${to} subject="${subject}" error="${safeError}"`);
    return { success: false, error: safeError, status: 'failed' };
  }
}

export interface PaymentSuccessEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderCode: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  address: string;
}

export interface SupportReceivedEmailData {
  customerName: string;
  customerEmail: string;
  ticketId: string;
  subject: string;
  submittedAt: string;
  messageSummary: string;
}

export interface SupportReplyEmailData {
  customerName: string;
  customerEmail: string;
  ticketId: string;
  subject: string;
  status: string;
  submittedAt: string;
  adminReply: string;
  originalMessage?: string;
  contactEmail: string;
}

export interface ContactAdminEmailData {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface ContactAcknowledgementEmailData {
  customerName: string;
  customerEmail: string;
  ticketId: string;
  subject: string;
  submittedAt: string;
  message?: string;
}

export const emailService = {
  async sendPaymentSuccess(data: PaymentSuccessEmailData): Promise<EmailSendResult> {
    const { subject, html } = paymentSuccessTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },

  async sendSupportReceived(data: SupportReceivedEmailData): Promise<EmailSendResult> {
    const { subject, html } = supportReceivedTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },

  async sendSupportReply(data: SupportReplyEmailData): Promise<EmailSendResult> {
    const { subject, html } = supportReplyTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },

  async sendContactAdmin(data: ContactAdminEmailData): Promise<EmailSendResult> {
    const { subject, html } = contactAdminTemplate(data);
    return sendMail(config.supportEmail, subject, html);
  },

  async sendContactAcknowledgement(data: ContactAcknowledgementEmailData): Promise<EmailSendResult> {
    const { subject, html } = contactAcknowledgementTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },
};

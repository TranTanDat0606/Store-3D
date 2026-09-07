import { getTransporter, isEmailEnabled } from './email.config';
import { config } from '../../config';
import { paymentSuccessTemplate } from './templates/payment-success';
import { supportReceivedTemplate } from './templates/support-received';
import { supportReplyTemplate } from './templates/support-reply';
import { contactAdminTemplate } from './templates/contact-admin';
import { contactAcknowledgementTemplate } from './templates/contact-acknowledgement';

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailEnabled()) {
    console.log(`[Email] Disabled — skipping send to ${to}: ${subject}`);
    return false;
  }
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: config.smtp.user,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}: ${subject}`, (err as Error).message);
    return false;
  }
}

export interface PaymentSuccessEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
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
  adminReply: string;
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
}

export const emailService = {
  async sendPaymentSuccess(data: PaymentSuccessEmailData): Promise<boolean> {
    const { subject, html } = paymentSuccessTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },

  async sendSupportReceived(data: SupportReceivedEmailData): Promise<boolean> {
    const { subject, html } = supportReceivedTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },

  async sendSupportReply(data: SupportReplyEmailData): Promise<boolean> {
    const { subject, html } = supportReplyTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },

  async sendContactAdmin(data: ContactAdminEmailData): Promise<boolean> {
    const { subject, html } = contactAdminTemplate(data);
    return sendMail(config.supportEmail, subject, html);
  },

  async sendContactAcknowledgement(data: ContactAcknowledgementEmailData): Promise<boolean> {
    const { subject, html } = contactAcknowledgementTemplate(data);
    return sendMail(data.customerEmail, subject, html);
  },
};

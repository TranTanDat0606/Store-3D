import { config } from '../config';

export interface ContactInput {
  fullname: string;
  email: string;
  phone: string;
  message: string;
}

export class ContactService {
  /**
   * Process a contact form submission.
   * Currently logs to console. Replace with actual SMTP/Nodemailer when configured.
   */
  async submit(data: ContactInput) {
    // TODO: Implement actual email sending with Nodemailer when SMTP is configured
    // For now, log the contact submission for review
    console.log('[Contact Submission]', {
      to: config.supportEmail,
      from: data.email,
      name: data.fullname,
      phone: data.phone,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Liên hệ của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
    };
  }
}

export const contactService = new ContactService();

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../config';

let transporter: Transporter | null = null;

export function getTransporter(): Transporter | null {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.password) {
    return null; // Gmail not configured — email disabled safely
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
}

export function isEmailEnabled(): boolean {
  return !!(config.smtp.host && config.smtp.user && config.smtp.password);
}

export interface SmtpVerifyResult {
  status: 'configured' | 'not_configured' | 'connection_ok' | 'auth_failed' | 'connection_failed';
  message: string;
}

export async function verifySmtp(): Promise<SmtpVerifyResult> {
  if (!isEmailEnabled()) {
    return {
      status: 'not_configured',
      message: 'SMTP chưa được cấu hình. Vui lòng thiết lập MAIL_HOST, MAIL_USER, MAIL_PASSWORD trong .env',
    };
  }
  const t = getTransporter();
  if (!t) {
    return {
      status: 'not_configured',
      message: 'Không thể tạo SMTP transporter',
    };
  }
  try {
    await t.verify();
    return {
      status: 'connection_ok',
      message: 'SMTP connection verified — authentication OK',
    };
  } catch (err) {
    const msg = (err as Error).message || String(err);
    if (msg.includes('Invalid login') || msg.includes('auth') || msg.includes('Username and Password not accepted')) {
      return {
        status: 'auth_failed',
        message: 'SMTP authentication failed — kiểm tra MAIL_USER và MAIL_PASSWORD (App Password)',
      };
    }
    return {
      status: 'connection_failed',
      message: `SMTP connection failed: ${msg}`,
    };
  }
}

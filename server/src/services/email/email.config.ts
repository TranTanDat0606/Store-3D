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

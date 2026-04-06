import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const secure = this.configService.get<string>('MAIL_SECURE') === 'true';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, content: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', '"TaskFlow" <noreply@taskflow.com>'),
        to,
        subject,
        text: content,
        html: html || content,
      });
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendInvitation(to: string, projectName: string, inviterName: string) {
    const subject = `Invitation to join project: ${projectName}`;
    const content = `Hello, ${inviterName} has invited you to join the project "${projectName}" on TaskFlow. Please register or login to join the team.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb;">You've been invited!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on TaskFlow.</p>
        <p>TaskFlow is a modern task management system designed to help teams collaborate efficiently.</p>
        <div style="margin: 30px 0;">
          <a href="${this.configService.get<string>('FRONTEND_URL')}/register" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Join TaskFlow Now</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link: ${this.configService.get<string>('FRONTEND_URL')}/register</p>
      </div>
    `;
    return this.sendMail(to, subject, content, html);
  }

  async sendProjectJoinNotification(to: string, projectName: string, inviterName: string) {
    const subject = `You've been added to project: ${projectName}`;
    const content = `Hello, ${inviterName} has added you to the project "${projectName}" on TaskFlow. Check it out now!`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb;">New Project Access!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has added you to the project <strong>"${projectName}"</strong> on TaskFlow.</p>
        <div style="margin: 30px 0;">
          <a href="${this.configService.get<string>('FRONTEND_URL')}/projects" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Project</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link: ${this.configService.get<string>('FRONTEND_URL')}/projects</p>
      </div>
    `;
    return this.sendMail(to, subject, content, html);
  }
}

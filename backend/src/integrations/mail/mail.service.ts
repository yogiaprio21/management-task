import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendMail(to: string, subject: string, content: string) {
    console.log(`Sending mail to ${to} with subject ${subject}`);
    // Implement actual mail sending logic here (e.g., Nodemailer)
    return true;
  }
}

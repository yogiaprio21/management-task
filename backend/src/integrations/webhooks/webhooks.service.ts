import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  // constructor(private httpService: HttpService) {}

  async triggerWebhook(url: string, payload: any) {
    console.log(`Triggering webhook ${url}`);
    // await lastValueFrom(this.httpService.post(url, payload));
    return true;
  }
}

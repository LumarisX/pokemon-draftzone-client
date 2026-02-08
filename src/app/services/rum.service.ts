import { Injectable } from '@angular/core';
import { AwsRum, AwsRumConfig } from 'aws-rum-web';
import { environment } from '../../environments/environment';
import type { ClientError } from '../error/error.service';

type RumConfig = AwsRumConfig & {
  endpoint?: string;
  signing?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class RumService {
  private rum: AwsRum | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized || !environment.rum?.enabled) {
      return;
    }

    const { appId, appVersion, region, ...config } = environment.rum;
    const rumConfig = { ...config } as RumConfig & { enabled?: boolean };
    delete rumConfig.enabled;

    if (!appId || !appVersion || !region) {
      return;
    }

    try {
      this.rum = new AwsRum(appId, appVersion, region, rumConfig);
      this.initialized = true;
    } catch (error) {
      console.warn('RUM initialization failed', error);
    }
  }

  recordClientError(error: ClientError): void {
    if (!this.rum) {
      return;
    }

    const message = error.error?.message || error.message || 'Client error';
    const errorToRecord = new Error(message);
    errorToRecord.name = error.error?.code || 'ClientError';
    if (error.error?.stack) {
      errorToRecord.stack = error.error.stack;
    }

    this.rum.recordError(errorToRecord);
    this.rum.recordEvent('client_error', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      requestId: error.meta?.requestId,
      errorCode: error.error?.code,
    });
  }
}

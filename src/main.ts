import { provideZoneChangeDetection } from "@angular/core";
import { platformBrowser } from '@angular/platform-browser';
import 'zone.js';
import { AppModule } from './app/app.module';

platformBrowser()
  .bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch((err) => console.error(err));

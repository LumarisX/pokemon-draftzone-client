import { bootstrapApplication } from '@angular/platform-browser';
import { PDZComponent } from '@pdz/pdz.component';
import { pdzConfig } from './pdz.config';

bootstrapApplication(PDZComponent, pdzConfig).catch((err) =>
  console.error(err),
);

import { bootstrapApplication } from '@angular/platform-browser';
import { PDZComponent } from '@pdz/pdz.component';
import { pdzConfig } from './pdz.config';

// platformBrowser()
//   .bootstrapModule(AppModule, {
//     applicationProviders: [provideZoneChangeDetection()],
//   })
//   .catch((err) => console.error(err));

bootstrapApplication(PDZComponent, pdzConfig).catch((err) =>
  console.error(err),
);

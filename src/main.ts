import { platformBrowser } from '@angular/platform-browser';
import 'zone.js';
import { AppModule } from './app/app.module';

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

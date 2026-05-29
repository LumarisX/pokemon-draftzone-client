import { CanDeactivateFn } from '@angular/router';
import { LeagueTierListFormComponent } from './league-tier-list-form.component';

export const unsavedChangesGuard: CanDeactivateFn<
  LeagueTierListFormComponent
> = (component) => component.canDeactivate();

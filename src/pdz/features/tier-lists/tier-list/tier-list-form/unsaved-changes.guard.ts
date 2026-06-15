import { CanDeactivateFn } from '@angular/router';
import { TierListFormComponent } from './tier-list-form.component';

export const unsavedChangesGuard: CanDeactivateFn<TierListFormComponent> = (
  component,
) => component.canDeactivate();

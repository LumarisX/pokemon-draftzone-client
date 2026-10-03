import { CanDeactivateFn } from '@angular/router';

export interface GuardsUnsavedChanges {
  canDeactivate(): boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<GuardsUnsavedChanges> = (
  component,
) => component.canDeactivate();

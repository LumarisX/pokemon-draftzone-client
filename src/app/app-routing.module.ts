import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'draft', redirectTo: 'draft' },
  { path: 'error', redirectTo: 'error' },
  { path: '**', pathMatch: 'full', redirectTo: 'draft' }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {

}
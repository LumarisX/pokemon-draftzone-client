import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './homepage/homepage.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
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
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeamsComponent } from './teams/teams.component';

const routes: Routes = [
  { path: 'drafts', component: TeamsComponent },
  { path: '', pathMatch: "full", redirectTo: 'drafts' },
  { path: '**', pathMatch: 'full', redirectTo: 'drafts' }
  
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {

}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { TeamsModule } from './teams/teams.module';



@NgModule({
  imports: [
    BrowserModule,
    TeamsModule,
    CoreModule,
    AppRoutingModule
  ],
  declarations: [ AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoreModule } from './core/core.module';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module.ts'



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    CoreModule,
    AppRoutingModule
  ]

})
export class AppModule {}
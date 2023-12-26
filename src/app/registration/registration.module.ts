import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { RegistrationRoutingModule } from './registration-routing.module';
import { SignupComponent } from './signup/signup.component';

@NgModule({
    imports: [CommonModule, LoginComponent, SignupComponent],
    exports: [RegistrationRoutingModule]
})
export class RegistrationModule { }
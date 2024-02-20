import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TestRoutingModule } from './test-routing.module';
import { TestComponent } from './test.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { FilterComponent } from '../filter/filter.component';

@NgModule({
  imports: [CommonModule, TestComponent, FilterComponent, TestRoutingModule],
  exports: [TestComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
  ],
})
export class TestModule {}

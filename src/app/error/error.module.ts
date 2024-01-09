import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ErrorRoutingModule } from './error-routing.module';
import { ErrorComponent } from './error.component';

@NgModule({
    imports: [CommonModule, ErrorComponent, ErrorRoutingModule],
    exports: [ErrorComponent]
})
export class ErrorModule { }
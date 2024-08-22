import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../images/sprite.component';
import { ErrorService } from './error.service';
import { CloseSVG } from '../images/svg-components/close.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'error',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    CloseSVG,
    ReactiveFormsModule,
  ],
  templateUrl: './error.component.html',
})
export class ErrorComponent implements OnInit {
  error?: HttpErrorResponse;

  constructor(private errorService: ErrorService) {}

  ngOnInit(): void {
    this.errorService.getErrorObservable().subscribe((error) => {
      this.error = error;
    });
  }

  clearError() {
    this.error = undefined;
  }
}

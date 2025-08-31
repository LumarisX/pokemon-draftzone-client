import {
  animate,
  animation,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CloseSVG } from '../images/svg-components/close.component';
import type { ClientError } from './error.service';
import { ErrorService } from './error.service';

@Component({
  selector: 'error',
  standalone: true,
  imports: [CommonModule, RouterModule, CloseSVG, ReactiveFormsModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        animation([
          animate(
            '600ms 0ms',
            keyframes([
              style({
                visibility: 'visible',
                opacity: 0,
                transform: 'translate3d(0, -50px, 0)',
                easing: 'ease',
                offset: 0,
              }),
              style({
                opacity: 1,
                transform: 'translate3d(0, 0, 0)',
                easing: 'ease',
                offset: 1,
              }),
            ]),
          ),
        ]),
      ]),
      transition(':leave', [
        animation([
          animate(
            '600ms 0ms',
            keyframes([
              style({
                opacity: 1,
                transform: 'translate3d(0, 0, 0)',
                easing: 'ease',
                offset: 0,
              }),
              style({
                visibility: 'visible',
                opacity: 0,
                transform: 'translate3d(0, 50px, 0)',
                easing: 'ease',
                offset: 1,
              }),
            ]),
          ),
        ]),
      ]),
    ]),
  ],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
})
export class ErrorComponent implements OnInit {
  private errorService = inject(ErrorService);

  error?: ClientError;

  ngOnInit(): void {
    this.errorService.getErrorObservable().subscribe((error) => {
      this.error = error;
    });
  }

  clearError() {
    this.error = undefined;
  }
}

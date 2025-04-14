import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UploadImageComponent } from './upload-image/upload-image.component';

@Component({
  selector: 'app-league',
  imports: [RouterLink, UploadImageComponent],
  templateUrl: './league.component.html',
  styleUrl: './league.component.scss',
})
export class LeagueComponent {}

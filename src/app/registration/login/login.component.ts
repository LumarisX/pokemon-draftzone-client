import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { FormBuilder } from '@angular/forms';

@Component({
    selector: 'login',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './login.component.html'
})
export class LoginComponent {

    constructor(private serverServices: ServerService, private fb: FormBuilder) { }

}

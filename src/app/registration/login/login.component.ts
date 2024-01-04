import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserService } from '../../api/user.service';
import { FormBuilder } from '@angular/forms';

@Component({
    selector: 'login',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './login.component.html'
})
export class LoginComponent {

    constructor(private serverServices: UserService, private fb: FormBuilder) { }

}

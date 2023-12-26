import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControlOptions, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CoreModule } from '../../sprite/sprite.module';
import { PasswordValidator, UsernameValidator } from '../registration.validator';
import { RegistrationService } from '../registration.service';

@Component({
    selector: 'signup',
    standalone: true,
    imports: [CommonModule, CoreModule, ReactiveFormsModule, RouterModule],
    templateUrl: './signup.component.html'
})
export class SignupComponent {

    constructor(private fb: FormBuilder, private regService: RegistrationService) { }

    signupForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required]],
        confirmpassword: ['', [Validators.required]]
    }, { validator: PasswordValidator } as FormControlOptions);

    onSubmit() {
        this.regService.newUser(this.signupForm.value).subscribe(
            response => console.log("Success!", response),
            error => console.error("Error!", error)
        )
    }
}

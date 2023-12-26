import { AbstractControl, ValidationErrors } from "@angular/forms";

export function UsernameValidator() {
    return null
}

export function PasswordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')
    const confirm = control.get('confirmpassword')
    return password && confirm && confirm.touched && confirm.value !== password.value ? { 'different': true } : null
}
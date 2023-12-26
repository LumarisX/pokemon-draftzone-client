import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServerService } from '../../api/server.service';

@Component({
    selector: 'signup',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div>signup</div>
    `
})
export class SignupComponent {

    constructor(private serverServices: ServerService) { }

}

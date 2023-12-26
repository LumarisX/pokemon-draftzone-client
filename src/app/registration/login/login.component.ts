import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServerService } from '../../api/server.service';

@Component({
    selector: 'login',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div>login</div>
    `
})
export class LoginComponent {

    constructor(private serverServices: ServerService) { }

}

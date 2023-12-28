import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OpponentDraft } from '../../draft';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { SpriteService } from '../../sprite/sprite.service';

@Component({
    selector: 'opponent-team-preview',
    standalone: true,
    imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
    templateUrl: './opponent-team-preview.component.html'
})
export class OpponentTeamPreviewComponent {
    @Input() team!: OpponentDraft;
    @Input() index = 0;

    constructor(private spriteService: SpriteService) {
    }

    spriteDiv(name: string) {
        return this.spriteService.getSprite(name);
    }

    score(a: number[]) {
        let s: string
        if (a.length == 0) {
            s = "0 - 0";
        } else {
            s = `${a[0]}  - ${a[1]}`
        }
        return s;
    }
}

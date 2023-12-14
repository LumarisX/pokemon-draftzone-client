import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { SpriteService } from './sprite.service';

@NgModule({
    imports: [ HttpClientModule ],
    providers: [ SpriteService ]
})
export class CoreModule { }
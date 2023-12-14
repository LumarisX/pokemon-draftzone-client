import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupRoutingModule } from './matchup-routing.module';
import { MatchupComponent } from './matchup.component';
import { TypechartComponent } from './typechart/typechart.component';

@NgModule({
    imports: [ CommonModule, MatchupComponent, MatchupRoutingModule],
    exports: [ MatchupComponent ]
})
export class MatchupModule { }
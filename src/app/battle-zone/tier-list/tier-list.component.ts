import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DataService } from '../../api/data.service';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'bz-tier-list',
  standalone: true,
  templateUrl: './tier-list.component.html',
  imports: [CommonModule, SpriteComponent, CdkDropList, CdkDrag],
  styles: `.example-list {
    width: 500px;
    max-width: 100%;
    border: solid 1px #ccc;
    min-height: 60px;
    display: block;
    background: white;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .example-box {
    padding: 20px 10px;
    border-bottom: solid 1px #ccc;
    color: rgba(0, 0, 0, 0.87);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    cursor: move;
    background: white;
    font-size: 14px;
  }
  
  .cdk-drag-preview {
    border: none;
    box-sizing: border-box;
    border-radius: 4px;
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                0 8px 10px 1px rgba(0, 0, 0, 0.14),
                0 3px 14px 2px rgba(0, 0, 0, 0.12);
  }
  
  .cdk-drag-placeholder {
    opacity: 0;
  }
  
  .cdk-drag-animating {
    transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
  }
  
  .example-box:last-child {
    border: none;
  }
  
  .example-list.cdk-drop-list-dragging .example-box:not(.cdk-drag-placeholder) {
    transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
  }
  `,
})
export class BZTierListComponent implements OnInit {
  list: Pokemon[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getPokemonList('Gen8 NatDex').subscribe((response) => {
      console.log('Recieved', response);
      this.list = response.species;
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.list, event.previousIndex, event.currentIndex);
  }
}

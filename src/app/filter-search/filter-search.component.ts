import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'filter-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div (focusout)="focusCheck($event)">
    <input class="border" placeholder="Enter search" [(ngModel)]="query" >
    <div *ngFor="let mon of list" (mousedown)="onClick($event)">{{mon}}</div>
</div>
  `,
  styleUrl: './filter-search.component.css'
})
export class FilterSearchComponent {
  list: string[] = [];
  _query = "";

  @Input() data!: any;

  set query(val: string) {
    this._query = val;
    this.filter(val);
  }

  get query() {
    return this._query;
  }

  filter(val: string) {

    if (val) {
      val = val.toLowerCase().trim().replace(/\s+/g, '-');
      let reg = new RegExp("(^|[-])" + val + ".*")
      let list: string[] = [];
      for (let item in this.data) {
        if (reg.test(this.data[<keyof typeof this.data>item]["name"].toLowerCase().replace(/\s+/g, '-'))) {
          list.push(this.data[<keyof typeof this.data>item]["name"])
        }
      }
      this.list = list;
    } else {
      this.resetList();
    }
  }

  resetList(){
    this.list = []
  }

  onClick(event: Event){
    const target = event.target as HTMLButtonElement;
    if(target) this.query = target.innerText;
    this.resetList();
  }

  focusCheck(event: Event){
    console.log(event);
    this.resetList();
  }

}



import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BattlePokedex } from '../pokedex';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'filter-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-search.component.html',
  styleUrl: './filter-search.component.css'
})
export class FilterSearchComponent {
  list: string[] = [];
  _message = "";

  @Input() data!: any;

  set message(val: string){
    this._message = val;
    this.filter(val);
  }

  get message(){
    return this._message;
  }

  filter(val:string){
    
    if(val){
      val = val.toLowerCase().trim().replace(/\s+/g,'-');
      let reg = new RegExp("(^|[-])" + val + ".*")
      let list: string[] = [];
      for(let item in this.data){
        if(reg.test(this.data[<keyof typeof this.data>item]["name"].toLowerCase().replace(/\s+/g,'-'))){
          list.push(this.data[<keyof typeof this.data>item]["name"])
        }
      }
      this.list = list;
    } else {
      this.list = []
    }
  }

}



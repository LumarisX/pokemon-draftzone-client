import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'plusSign',
})
export class PlusSignPipe implements PipeTransform {
  transform(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }
}

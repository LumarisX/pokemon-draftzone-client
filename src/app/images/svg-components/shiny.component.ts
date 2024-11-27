import { Component } from '@angular/core';

@Component({
  selector: 'shiny-svg',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="w-full h-full stroke-symbolColor-main"
      fill="none"
      transform="scale(-1 1)"
    >
      <path
        d="M5 16v4M6 4v4m1 10H3M8 6H4m9-2 1.753 4.444c.188.477.282.715.426.916q.192.269.461.461c.2.144.44.238.916.426L21 12l-4.444 1.753c-.477.188-.715.282-.916.426a2 2 0 0 0-.461.461c-.144.2-.238.44-.426.916L13 20l-1.753-4.444c-.188-.477-.282-.715-.426-.916a2 2 0 0 0-.461-.461c-.2-.144-.44-.238-.916-.426L5 12l4.444-1.753c.477-.188.715-.282.916-.426q.269-.192.461-.461c.144-.2.238-.44.426-.916z"
        stroke="#000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class ShinySVG {}

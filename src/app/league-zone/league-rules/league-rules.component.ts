import { Component, VERSION } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'pdz-league-rules',
  imports: [FormsModule, MatExpansionModule, MatButtonModule, MarkdownModule],
  standalone: true,
  templateUrl: './league-rules.component.html',
  styleUrl: './league-rules.component.scss',
})
export class LeagueRulesComponent {
  angularVersion = VERSION.full;
  ngxMarkdownVersion = '19.1.1';

  markdown = `## Markdown __rulez__!
---

### Syntax highlight
\`\`\`typescript
const language = 'typescript';
\`\`\`

### Lists
1. Ordered list
2. Another bullet point
   - Unordered list
   - Another unordered bullet

### Blockquote
> Blockquote to the max`;
}

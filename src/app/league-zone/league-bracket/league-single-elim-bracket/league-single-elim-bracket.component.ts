import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as d3 from 'd3'; // Import D3 library

// Define the structure for bracket data nodes (optional but good practice)
interface BracketNode {
  name?: string;
  eliminated?: boolean;
  children?: BracketNode[];
}

@Component({
  selector: 'pdz-league-single-elim-bracket', // Component selector
  template: `
    <div class="bracket-container p-4 bg-white rounded shadow">
      <h2 class="text-xl font-semibold text-center mb-4">
        {{ componentTitle }}
      </h2>
      <svg #bracketSvgContainer></svg>
    </div>
  `,
  styles: [
    `
      /* Component-specific styles (can be moved to a separate .css file) */
      /* Using :host ::ng-deep for potentially overriding D3 default styles if needed,
       or just define them globally if preferred. For simplicity here, we define them directly.
       If not using ::ng-deep, ensure these styles are in a global stylesheet or
       configure view encapsulation appropriately. */

      :host ::ng-deep .link {
        fill: none;
        stroke: #ccc;
        stroke-width: 2px;
      }

      :host ::ng-deep .node circle {
        fill: #fff;
        stroke: steelblue;
        stroke-width: 3px;
        r: 5px;
      }

      :host ::ng-deep .node text {
        font: 12px sans-serif;
        fill: #333;
      }

      /* Ensure the container allows scrolling if bracket is too wide */
      :host .bracket-container {
        width: 100%;
        overflow-x: auto;
        background-color: white; /* Ensure background for contrast */
      }

      /* Default SVG size - can be adjusted */
      :host ::ng-deep svg {
        width: 900px; /* Default width */
        height: 500px; /* Default height */
        display: block; /* Prevents extra space below SVG */
        margin: auto; /* Center if container is wider */
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush for better performance if inputs don't change often
})
export class LeagueSingleElimBracketComponent
  implements OnInit, AfterViewInit, OnChanges
{
  // --- Component Inputs ---
  @Input() componentTitle: string = 'Tournament Bracket (Single Elimination)'; // Allow title customization
  @Input() bracketData: BracketNode = {
    // Default sample data, can be overridden by parent component
    children: [
      {
        children: [
          {
            children: [
              {
                children: [{ name: '02ThatOneGuy' }, { name: 'TheNPC420' }],
              },
              {
                children: [{ name: 'Lion' }, { name: 'Steven' }],
              },
            ],
          },
          {
            children: [
              {
                children: [{ name: 'Feather' }, { name: 'BR@D' }],
              },
              {
                children: [{ name: 'Dotexe' }, { name: 'Kat' }],
              },
            ],
          },
        ],
      },
      {
        children: [
          {
            children: [
              {
                children: [{ name: 'ChristianDeputy' }, { name: 'Lumaris' }],
              },
              {
                children: [{ name: 'Speedy' }, { name: 'SuperSpiderPig' }],
              },
            ],
          },
          {
            children: [
              {
                children: [{ name: 'Hsoj' }, { name: 'Jimothy J' }],
              },
              {
                name: 'TheNotoriousABS',
                children: [
                  { name: 'TheNotoriousABS' },
                  { name: 'Rai', eliminated: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  @Input() width: number = 900; // Allow width customization
  @Input() height: number = 500; // Allow height customization

  imageSize = 16;
  // --- View Child ---
  // Get a reference to the SVG element in the template
  @ViewChild('bracketSvgContainer') private bracketContainer!: ElementRef;

  // --- Lifecycle Hooks ---
  constructor() {}

  ngOnInit(): void {
    // Initialization logic if needed before view is ready
  }

  ngAfterViewInit(): void {
    // Called after the component's view (and child views) has been initialized.
    // This is the ideal place to run D3 code that manipulates the DOM.
    if (this.bracketData) {
      this.createBracket();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Called before ngOnInit and whenever one or more data-bound input properties change.
    // If the bracketData, width, or height inputs change, redraw the bracket.
    if (
      (changes['bracketData'] || changes['width'] || changes['height']) &&
      !changes['bracketData']?.firstChange
    ) {
      // Check if bracketContainer is available before redrawing
      if (this.bracketContainer?.nativeElement) {
        this.createBracket();
      }
    }
  }

  // --- D3 Drawing Logic ---
  private createBracket(): void {
    // Ensure data is present
    if (!this.bracketData) {
      console.error('Bracket data is missing.');
      return;
    }

    // Get the native SVG element
    const element = this.bracketContainer.nativeElement;

    // Clear previous SVG content before drawing
    d3.select(element).selectAll('*').remove();

    // --- SVG Setup ---
    const svg = d3
      .select(element)
      .attr('width', this.width) // Use input width
      .attr('height', this.height); // Use input height

    const clipPathId = 'circle-mask';

    // Add a <defs> section to the SVG
    const defs = svg.append('defs');

    // Define the clip path
    defs
      .append('clipPath')
      .attr('id', clipPathId) // Assign the unique ID
      .append('circle')
      .attr('cx', 0) // Center the circle horizontally within the clip path
      .attr('cy', 0) // Center the circle vertically within the clip path
      .attr('r', this.imageSize / 2);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 }; // Margins for labels
    const innerWidth = this.width - margin.left - margin.right;
    const innerHeight = this.height - margin.top - margin.bottom;

    // Create a group element shifted by the margins
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // --- D3 Hierarchy and Tree Layout ---
    // Create a tree layout generator.
    const treeLayout = d3
      .tree<BracketNode>() // Specify the node type
      .size([innerHeight, innerWidth - 160]); // Use inner dimensions, adjusted for labels

    // Create the hierarchy from the nested data.
    const root = d3.hierarchy(this.bracketData);

    // Assign positions (x, y) to each node in the hierarchy.
    treeLayout(root);

    root.each((d) => {
      d.y = innerWidth - d.y! - 160; // Adjust y based on innerWidth
    });

    // --- Draw Links (Connections) ---
    // Create a link generator for horizontal links.
    const linkGenerator = d3
      .linkHorizontal<any, d3.HierarchyPointNode<BracketNode>>() // Specify types
      .x((d) => d.y) // Use node.y for horizontal position
      .y((d) => d.x); // Use node.x for vertical position

    function elbowLinkGenerator(d: d3.HierarchyLink<BracketNode>): string {
      const source = d.source as d3.HierarchyPointNode<BracketNode>;
      const target = d.target as d3.HierarchyPointNode<BracketNode>;

      // Calculate the midpoint Y for the elbow turn
      const branchY = (5 * source.y + target.y) / 6;

      // Construct the path string:
      // M = Move to source x,y
      // H = Horizontal line to midpoint Y
      // V = Vertical line to target x
      // H = Horizontal line to target y
      return (
        `M${source.y},${source.x}` + // Move to source position
        `H${branchY}` + // Draw horizontal line towards the middle
        `V${target.x}` + // Draw vertical line to target's vertical position
        `H${target.y}`
      ); // Draw horizontal line to target's horizontal position
    }
    // Select all links, join data, and draw paths.
    g.selectAll('.link')
      .data(root.links()) // Get the links array from the hierarchy
      .join('path')
      .attr('class', 'link')
      .attr('d', elbowLinkGenerator); // Use the generator to create the 'd' attribute

    // --- Draw Nodes ---
    // Select all nodes, join data, and create groups for each node.
    const node = g
      .selectAll('.node')
      .data(root.descendants()) // Get all nodes (root + children)
      .join('g')
      // Position each node group using its calculated x and y.
      .attr(
        'class',
        (d: d3.HierarchyNode<BracketNode>) =>
          `node ${d.children ? 'node--internal' : 'node--leaf'}`,
      )
      .attr(
        'transform',
        (d: d3.HierarchyNode<BracketNode>) => `translate(${d.y},${d.x})`,
      );

    node
      .append('image')
      .attr('xlink:href', 'https://picsum.photos/200')
      .attr('x', -this.imageSize / 2)
      .attr('y', -this.imageSize / 2)
      .attr('width', this.imageSize)
      .attr('height', this.imageSize)
      .attr('clip-path', `url(#${clipPathId})`); // Apply the clip path

    // Add text labels to each node group.

    const labelOffset = 0.5;
    node
      .append('text')
      .attr('dy', '-0.21em') // Vertical alignment adjustment
      // .attr(
      //   'dy',
      //   (d: d3.HierarchyNode<BracketNode>) =>
      //     `${(d.parent?.children?.indexOf(d) ? 1 : -1) * labelOffset + 0.31}rem`,
      // )

      // Position text to the left for leaf nodes (participants), right for others
      .attr('x', 13) // Offset from the circle
      .attr('text-anchor', 'start')
      .attr('text-decoration', (d: d3.HierarchyNode<BracketNode>) =>
        d.data.eliminated ? 'line-through' : 'none',
      )
      .text((d: d3.HierarchyNode<BracketNode>) => d.data.name ?? '')
      .clone(true)
      .lower()
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .attr('stroke', 'white');
  }
}

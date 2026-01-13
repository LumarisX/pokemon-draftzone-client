import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import * as d3 from 'd3';

export interface HpOutcome {
  hp: number;
  probability: number;
}

@Component({
  selector: 'pdz-hp-chart',
  templateUrl: './hp-chart.component.html',
  styleUrls: ['./hp-chart.component.scss'],
  standalone: true,
})
export class HpChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() maxHp!: number;
  @Input() outcomes: HpOutcome[] = [];
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: any = null;
  private lastWidth: number = 0;
  private readonly margin = { top: 50, right: 30, bottom: 40, left: 50 };

  ngAfterViewInit(): void {
    console.log(
      'HpChartComponent initialized with maxHp:',
      this.maxHp,
      'outcomes:',
      this.outcomes.length,
    );
    this.initializeChart();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('HpChartComponent changes detected:', changes);
    if (changes['outcomes'] || changes['maxHp']) {
      if (this.svg) {
        console.log(
          'Updating existing chart with',
          this.outcomes.length,
          'outcomes, maxHp:',
          this.maxHp,
        );
        this.updateChart();
      } else if (this.chartContainer) {
        // If SVG doesn't exist yet but container does, initialize the chart
        console.log('Initializing chart for the first time');
        this.initializeChart();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initializeChart(): void {
    if (!this.chartContainer) return;

    const container = this.chartContainer.nativeElement;
    const width = container.clientWidth;
    const height = 300;

    // Store current width to prevent resize loops
    this.lastWidth = width;

    // Clear any existing SVG
    d3.select(container).selectAll('svg').remove();

    // Create SVG
    this.svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.updateChart();
  }

  private updateChart(): void {
    console.log(
      'updateChart called - maxHp:',
      this.maxHp,
      'outcomes:',
      this.outcomes.length,
    );
    if (!this.svg || !this.maxHp || this.outcomes.length === 0) {
      console.warn('Cannot update chart - missing data or SVG not initialized');
      return;
    }

    const container = this.chartContainer.nativeElement;
    const width = container.clientWidth;
    const height = 300;
    const innerWidth = width - this.margin.left - this.margin.right;
    const innerHeight = height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    // Create main group with margins
    const g = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Sort outcomes by HP (descending for right-to-left display)
    const sortedOutcomes = [...this.outcomes].sort((a, b) => b.hp - a.hp);

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, this.maxHp])
      .range([innerWidth, 0]); // Reversed for right-to-left

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(sortedOutcomes, (d) => d.probability) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => `${((d as number) * 100).toFixed(1)}%`);

    // Add X axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('HP Remaining');

    // Add Y axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Probability');

    // Calculate bar width based on HP range
    const barWidth = Math.max(2, innerWidth / (this.maxHp + 1));

    // Create bars
    g.selectAll('.bar')
      .data(sortedOutcomes)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.hp) - barWidth / 2)
      .attr('y', (d) => yScale(d.probability))
      .attr('width', barWidth)
      .attr('height', (d) => innerHeight - yScale(d.probability))
      .attr('fill', (d) => this.getBarColor(d.hp))
      .attr('opacity', 0.8)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1);
        // Show tooltip
        const tooltip = g
          .append('g')
          .attr('class', 'tooltip')
          .attr(
            'transform',
            `translate(${xScale(d.hp)},${yScale(d.probability) - 10})`,
          );

        tooltip
          .append('rect')
          .attr('x', -40)
          .attr('y', -25)
          .attr('width', 80)
          .attr('height', 20)
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 4);

        tooltip
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('y', -10)
          .text(`${d.hp} HP: ${(d.probability * 100).toFixed(2)}%`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8);
        g.selectAll('.tooltip').remove();
      });

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => ''),
      );

    // Calculate and display mean HP
    const meanHp = this.calculateMeanHp(sortedOutcomes);
    const meanPercentage = (meanHp / this.maxHp) * 100;

    // Add mean line
    const meanLine = g.append('g').attr('class', 'mean-line');

    meanLine
      .append('line')
      .attr('x1', xScale(meanHp))
      .attr('y1', 0)
      .attr('x2', xScale(meanHp))
      .attr('y2', innerHeight)
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5);

    // Add mean label background - positioned above the chart area
    const labelWidth = 90;
    const labelHeight = 36;
    const labelX = xScale(meanHp) - labelWidth / 2;
    const labelY = -40; // Moved further up to avoid overlap

    meanLine
      .append('rect')
      .attr('x', labelX)
      .attr('y', labelY)
      .attr('width', labelWidth)
      .attr('height', labelHeight)
      .attr('fill', '#2196F3')
      .attr('rx', 4)
      .attr('opacity', 0.85);

    // Add mean label text
    meanLine
      .append('text')
      .attr('x', xScale(meanHp))
      .attr('y', labelY + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text('Mean HP');

    meanLine
      .append('text')
      .attr('x', xScale(meanHp))
      .attr('y', labelY + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${meanHp.toFixed(1)} (${meanPercentage.toFixed(1)}%)`);
  }

  private calculateMeanHp(outcomes: HpOutcome[]): number {
    // Calculate weighted average (expected value)
    const totalProbability = outcomes.reduce(
      (sum, o) => sum + o.probability,
      0,
    );
    const weightedSum = outcomes.reduce(
      (sum, o) => sum + o.hp * o.probability,
      0,
    );
    return totalProbability > 0 ? weightedSum / totalProbability : 0;
  }

  private getBarColor(hp: number): string {
    const percentage = hp / this.maxHp;
    if (percentage <= 0.25) return '#d32f2f'; // Light red
    if (percentage <= 0.5) return '#ffd54f'; // Yellow
    return '#66bb6a'; // Green
  }

  private setupResizeObserver(): void {
    if (!this.chartContainer) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      // Debounce and check if width actually changed
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(() => {
        const entry = entries[0];
        const newWidth = entry.contentRect.width;

        // Only reinitialize if width changed significantly (more than 5px)
        if (Math.abs(newWidth - this.lastWidth) > 5) {
          this.initializeChart();
        }
      }, 250); // Debounce for 250ms
    });

    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }
}

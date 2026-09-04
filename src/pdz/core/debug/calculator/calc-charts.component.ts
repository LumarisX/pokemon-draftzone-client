import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  ViewChild,
  input,
} from '@angular/core';
import * as d3 from 'd3';
import { CalcResponse } from './calculator.model';

const MARGIN = { top: 12, right: 16, bottom: 30, left: 46 };
const WIDTH = 640;
const HEIGHT = 200;

const INK = 'var(--pdz-color-on-surface)';
const MUTED = 'var(--pdz-color-on-surface-variant)';
const GRID = 'var(--pdz-color-outline-variant)';
const SERIES = 'var(--pdz-color-primary)';
const LETHAL = 'var(--pdz-color-danger)';

interface Tip {
  x: number;
  y: number;
  lines: string[];
}

@Component({
  selector: 'pdz-calc-charts',
  templateUrl: './calc-charts.component.html',
  styleUrl: './calc-charts.component.scss',
})
export class CalcChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('pmf', { static: true }) pmfRef!: ElementRef<SVGSVGElement>;
  @ViewChild('survival', { static: true })
  survivalRef!: ElementRef<SVGSVGElement>;
  @ViewChild('ko', { static: true }) koRef!: ElementRef<SVGSVGElement>;
  @ViewChild('turns', { static: true }) turnsRef!: ElementRef<SVGSVGElement>;

  readonly result = input<CalcResponse | undefined>(undefined);

  readonly width = WIDTH;
  readonly height = HEIGHT;

  tip: Tip | null = null;

  private ready = false;

  ngAfterViewInit(): void {
    this.ready = true;
    this.renderAll();
  }

  ngOnChanges(): void {
    if (this.ready) this.renderAll();
  }

  ngOnDestroy(): void {
    for (const ref of [this.pmfRef, this.survivalRef, this.koRef, this.turnsRef]) {
      d3.select(ref.nativeElement).selectAll('*').remove();
    }
  }

  get startingHp(): number {
    const outcomes = this.result()?.outcomes ?? [];
    return outcomes.length ? outcomes[0].damage + outcomes[0].hp : 0;
  }

  get ohkoChance(): number {
    return this.atLeast(this.startingHp);
  }

  get maxDamage(): number {
    const rolls = this.result()?.damage?.rolls ?? [];
    return rolls.length ? rolls[rolls.length - 1].damage : 0;
  }

  get ohkoPossible(): boolean {
    return this.maxDamage >= this.startingHp && this.startingHp > 0;
  }

  atLeast(damage: number): number {
    const rolls = this.result()?.damage?.rolls ?? [];
    return rolls
      .filter((roll) => roll.damage >= damage)
      .reduce((sum, roll) => sum + roll.probability, 0);
  }

  get thresholds(): { hits: number; damage: number; probability: number }[] {
    const rolls = this.result()?.damage?.rolls ?? [];
    const hp = this.startingHp;
    if (!rolls.length || hp <= 0) return [];

    const min = rolls[0].damage;
    const max = rolls[rolls.length - 1].damage;
    const marks: { hits: number; damage: number; probability: number }[] = [];

    for (let hits = 1; hits <= 12; hits++) {
      const needed = Math.ceil(hp / hits);
      if (needed > max) continue;
      if (needed < min) break;
      marks.push({ hits, damage: needed, probability: this.atLeast(needed) });
    }

    return marks.slice(0, 5);
  }

  private renderAll(): void {
    this.renderPmf();
    this.renderSurvival();
    this.renderTurnsToKo();
    this.renderKo();
  }

  private frame(element: SVGSVGElement) {
    const svg = d3.select(element);
    svg.selectAll('*').remove();
    return {
      svg,
      plot: svg
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`),
      innerWidth: WIDTH - MARGIN.left - MARGIN.right,
      innerHeight: HEIGHT - MARGIN.top - MARGIN.bottom,
    };
  }

  private axes(
    plot: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: d3.AxisScale<never> | d3.AxisScale<number> | d3.AxisScale<string>,
    y: d3.ScaleLinear<number, number>,
    innerWidth: number,
    innerHeight: number,
    xLabel: string,
    yLabel: string,
    xTickCount = 6,
  ) {
    plot
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        (d3.axisBottom(x as d3.AxisScale<d3.AxisDomain>) as d3.Axis<d3.AxisDomain>).ticks?.(
          xTickCount,
        ) ?? d3.axisBottom(x as d3.AxisScale<d3.AxisDomain>),
      )
      .call((g) => g.select('.domain').attr('stroke', GRID))
      .call((g) => g.selectAll('.tick line').attr('stroke', GRID))
      .call((g) => g.selectAll('text').attr('fill', MUTED).attr('font-size', 10));

    plot
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat((d) => `${Math.round((d as number) * 100)}%`),
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('x2', innerWidth)
          .attr('stroke', GRID)
          .attr('stroke-opacity', 0.5),
      )
      .call((g) => g.selectAll('text').attr('fill', MUTED).attr('font-size', 10));

    plot
      .append('text')
      .attr('x', innerWidth)
      .attr('y', innerHeight + 26)
      .attr('text-anchor', 'end')
      .attr('fill', MUTED)
      .attr('font-size', 10)
      .text(xLabel);

    plot
      .append('text')
      .attr('x', 0)
      .attr('y', -2)
      .attr('fill', MUTED)
      .attr('font-size', 10)
      .text(yLabel);
  }

  private renderPmf(): void {
    const rolls = this.result()?.damage?.rolls ?? [];
    const { plot, innerWidth, innerHeight } = this.frame(this.pmfRef.nativeElement);
    if (!rolls.length) return this.empty(this.pmfRef.nativeElement);

    const hp = this.startingHp;
    const x = d3
      .scaleBand<number>()
      .domain(rolls.map((r) => r.damage))
      .range([0, innerWidth])
      .padding(0.25);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(rolls, (r) => r.probability) ?? 1])
      .nice()
      .range([innerHeight, 0]);

    this.axes(plot, x, y, innerWidth, innerHeight, 'damage', 'probability');

    plot
      .selectAll('rect.bar')
      .data(rolls)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.damage) ?? 0)
      .attr('y', (d) => y(d.probability))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d.probability))
      .attr('rx', 2)
      .attr('fill', (d) => (d.damage >= hp ? LETHAL : SERIES))
      .on('mousemove', (event: MouseEvent, d) =>
        this.showTip(event, [
          `${d.damage} damage${d.damage >= hp ? ' — lethal' : ''}`,
          `${(d.probability * 100).toFixed(2)}%`,
        ]),
      )
      .on('mouseleave', () => (this.tip = null));

    if (hp > 0 && rolls.some((r) => r.damage >= hp)) {
      const first = rolls.find((r) => r.damage >= hp)!;
      const cut = (x(first.damage) ?? 0) - x.step() * 0.125;
      plot
        .append('line')
        .attr('x1', cut)
        .attr('x2', cut)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', LETHAL)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3');
      plot
        .append('text')
        .attr('x', cut + 4)
        .attr('y', 10)
        .attr('fill', LETHAL)
        .attr('font-size', 10)
        .text(`KO at ${hp}`);
    }
  }

  private renderSurvival(): void {
    const rolls = this.result()?.damage?.rolls ?? [];
    const { plot, innerWidth, innerHeight } = this.frame(
      this.survivalRef.nativeElement,
    );
    if (!rolls.length) return this.empty(this.survivalRef.nativeElement);

    let cumulative = 0;
    const points = rolls.map((roll) => {
      const atLeast = 1 - cumulative;
      cumulative += roll.probability;
      return { damage: roll.damage, atLeast };
    });

    const hp = this.startingHp;
    const x = d3
      .scaleLinear()
      .domain([points[0].damage, points[points.length - 1].damage])
      .nice()
      .range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    this.axes(plot, x, y, innerWidth, innerHeight, 'damage ≥ x', 'probability');

    plot
      .append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', SERIES)
      .attr('stroke-width', 2)
      .attr(
        'd',
        d3
          .line<{ damage: number; atLeast: number }>()
          .curve(d3.curveStepAfter)
          .x((d) => x(d.damage))
          .y((d) => y(d.atLeast)),
      );

    for (const mark of this.thresholds) {
      const at = x(mark.damage);
      if (at < 0 || at > innerWidth) continue;

      plot
        .append('line')
        .attr('x1', at)
        .attr('x2', at)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', LETHAL)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3')
        .attr('stroke-opacity', mark.hits === 1 ? 1 : 0.55);

      plot
        .append('circle')
        .attr('cx', at)
        .attr('cy', y(mark.probability))
        .attr('r', 4.5)
        .attr('fill', LETHAL)
        .attr('stroke', 'var(--pdz-color-surface-container-low)')
        .attr('stroke-width', 2);

      plot
        .append('text')
        .attr('x', at + 4)
        .attr('y', 10)
        .attr('fill', LETHAL)
        .attr('font-size', 10)
        .text(`${mark.hits}HKO`);

      plot
        .append('circle')
        .attr('cx', at)
        .attr('cy', y(mark.probability))
        .attr('r', 10)
        .attr('fill', 'transparent')
        .on('mousemove', (event: MouseEvent) =>
          this.showTip(event, [
            `${mark.hits}HKO needs ≥ ${mark.damage} per hit`,
            `${(mark.probability * 100).toFixed(2)}% of rolls clear it`,
          ]),
        )
        .on('mouseleave', () => (this.tip = null));
    }

    plot
      .selectAll('circle.hit')
      .data(points)
      .join('circle')
      .attr('class', 'hit')
      .attr('cx', (d) => x(d.damage))
      .attr('cy', (d) => y(d.atLeast))
      .attr('r', 8)
      .attr('fill', 'transparent')
      .on('mousemove', (event: MouseEvent, d) =>
        this.showTip(event, [
          `P(damage ≥ ${d.damage})`,
          `${(d.atLeast * 100).toFixed(2)}%`,
        ]),
      )
      .on('mouseleave', () => (this.tip = null));
  }

  private renderTurnsToKo(): void {
    const ko = this.result()?.ko;
    const { plot, innerWidth, innerHeight } = this.frame(
      this.turnsRef.nativeElement,
    );
    if (!ko?.exactlyOnTurn?.length) return this.empty(this.turnsRef.nativeElement);

    const data = ko.exactlyOnTurn.map((probability, index) => ({
      turn: index + 1,
      probability,
    }));
    if (ko.unresolved > 1e-9) {
      data.push({ turn: 0, probability: ko.unresolved });
    }

    const label = (turn: number) => (turn === 0 ? 'none' : `${turn}`);
    const x = d3
      .scaleBand<number>()
      .domain(data.map((d) => d.turn))
      .range([0, innerWidth])
      .padding(0.35);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.probability) ?? 1])
      .nice()
      .range([innerHeight, 0]);

    plot
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat((d) => label(d as number)))
      .call((g) => g.select('.domain').attr('stroke', GRID))
      .call((g) => g.selectAll('.tick line').attr('stroke', GRID))
      .call((g) => g.selectAll('text').attr('fill', MUTED).attr('font-size', 10));

    plot
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat((d) => `${Math.round((d as number) * 100)}%`),
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('x2', innerWidth)
          .attr('stroke', GRID)
          .attr('stroke-opacity', 0.5),
      )
      .call((g) => g.selectAll('text').attr('fill', MUTED).attr('font-size', 10));

    plot
      .append('text')
      .attr('x', innerWidth)
      .attr('y', innerHeight + 26)
      .attr('text-anchor', 'end')
      .attr('fill', MUTED)
      .attr('font-size', 10)
      .text('turn the target faints on');

    plot
      .selectAll('rect.turn')
      .data(data)
      .join('rect')
      .attr('class', 'turn')
      .attr('x', (d) => x(d.turn) ?? 0)
      .attr('y', (d) => y(d.probability))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d.probability))
      .attr('rx', 4)
      .attr('fill', (d) => (d.turn === 0 ? MUTED : SERIES))
      .on('mousemove', (event: MouseEvent, d) =>
        this.showTip(event, [
          d.turn === 0 ? `still standing after ${data.length - 1} turns` : `faints on turn ${d.turn}`,
          `${(d.probability * 100).toFixed(2)}%`,
        ]),
      )
      .on('mouseleave', () => (this.tip = null));

    plot
      .selectAll('text.turn-label')
      .data(data.filter((d) => d.probability > 0.005))
      .join('text')
      .attr('class', 'turn-label')
      .attr('x', (d) => (x(d.turn) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.probability) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', INK)
      .attr('font-size', 10)
      .text((d) => `${(d.probability * 100).toFixed(1)}%`);
  }

  private renderKo(): void {
    const chances = this.result()?.ko?.chances ?? [];
    const { plot, innerWidth, innerHeight } = this.frame(this.koRef.nativeElement);
    if (!chances.length) return this.empty(this.koRef.nativeElement);

    const data = chances.map((chance, index) => ({ turn: index + 1, chance }));
    const x = d3
      .scaleBand<number>()
      .domain(data.map((d) => d.turn))
      .range([0, innerWidth])
      .padding(0.35);
    const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    this.axes(plot, x, y, innerWidth, innerHeight, 'turn', 'cumulative KO chance');

    plot
      .selectAll('rect.ko')
      .data(data)
      .join('rect')
      .attr('class', 'ko')
      .attr('x', (d) => x(d.turn) ?? 0)
      .attr('y', (d) => y(d.chance))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d.chance))
      .attr('rx', 4)
      .attr('fill', SERIES)
      .on('mousemove', (event: MouseEvent, d) =>
        this.showTip(event, [
          `by turn ${d.turn}`,
          `${(d.chance * 100).toFixed(2)}%`,
        ]),
      )
      .on('mouseleave', () => (this.tip = null));

    plot
      .selectAll('text.ko-label')
      .data(data)
      .join('text')
      .attr('class', 'ko-label')
      .attr('x', (d) => (x(d.turn) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.chance) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', INK)
      .attr('font-size', 10)
      .text((d) => (d.chance > 0 ? `${(d.chance * 100).toFixed(1)}%` : ''));
  }

  private empty(element: SVGSVGElement): void {
    d3.select(element)
      .append('text')
      .attr('x', WIDTH / 2)
      .attr('y', HEIGHT / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', MUTED)
      .attr('font-size', 12)
      .text('No data');
  }

  private showTip(event: MouseEvent, lines: string[]): void {
    const host = (event.currentTarget as SVGElement).ownerSVGElement;
    const bounds = host?.getBoundingClientRect();
    this.tip = {
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
      lines,
    };
  }
}

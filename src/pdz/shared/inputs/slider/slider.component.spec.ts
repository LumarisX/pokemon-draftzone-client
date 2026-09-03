import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SliderComponent, SliderTickTone } from './slider.component';

@Component({
  imports: [FormsModule, SliderComponent],
  template: `
    <pdz-slider
      [min]="0"
      [max]="252"
      [step]="4"
      [snapValues]="snaps()"
      [tickTones]="tones()"
      [(ngModel)]="value"
    />
  `,
})
class HostComponent {
  readonly snaps = signal<number[]>([0, 4, 12, 28, 60, 252]);
  readonly tones = signal<SliderTickTone[] | undefined>(undefined);
  value = 0;
}

describe('SliderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function slider(): SliderComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type=range]');
  }

  function press(key: string): void {
    input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  function drag(to: number): void {
    const element = input();
    element.value = String(to);
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('tick positions', () => {
    it('places each notch where its value falls, not evenly', () => {
      const positions = slider().tickMarks().map((tick) => tick.position);

      expect(positions).toEqual([
        0,
        (4 / 252) * 100,
        (12 / 252) * 100,
        (28 / 252) * 100,
        (60 / 252) * 100,
        100,
      ]);
    });

    it('spaces the early notches closer together than the late ones', () => {
      const [first, second, third] = slider()
        .tickMarks()
        .map((tick) => tick.position);

      expect(second - first).toBeLessThan(third - second);
    });

    it('defaults every notch to a neutral tone', () => {
      expect(slider().tickMarks().map((tick) => tick.tone)).toEqual(
        Array(6).fill('neutral'),
      );
    });

    it('applies tones index-for-index', () => {
      host.tones.set(['bad', 'neutral', 'good', 'neutral', 'good', 'bad']);
      fixture.detectChanges();

      expect(slider().tickMarks().map((tick) => tick.tone)).toEqual([
        'bad',
        'neutral',
        'good',
        'neutral',
        'good',
        'bad',
      ]);
    });

    it('renders a mark per notch', () => {
      const marks = fixture.nativeElement.querySelectorAll('.slider__tick');

      expect(marks).toHaveLength(6);
    });
  });

  describe('snapping', () => {
    it('lands on the nearest stop rather than between them', () => {
      drag(22);

      expect(host.value).toBe(28);
      expect(input().value).toBe('28');
    });

    it('rewrites the native input so the thumb cannot rest off a stop', () => {
      drag(10);

      expect(input().value).toBe('12');
    });

    it('breaks an exact tie towards the lower stop', () => {
      drag(8);

      expect(host.value).toBe(4);
    });

    it('is stable when the same pointer position repeats', () => {
      const seen: number[] = [];
      slider().valueChange.subscribe((value) => seen.push(value));

      for (let i = 0; i < 10; i++) drag(10);

      expect(host.value).toBe(12);
      expect(seen).toEqual([12]);
    });

    it('does not oscillate across a gap wider than the step', () => {
      const seen: number[] = [];
      slider().valueChange.subscribe((value) => seen.push(value));

      for (const raw of [1, 2, 1, 2, 1]) drag(raw);

      expect(seen).toEqual([]);
      expect(host.value).toBe(0);
    });

    it('moves monotonically as the pointer sweeps across', () => {
      const seen: number[] = [];
      slider().valueChange.subscribe((value) => seen.push(value));

      for (let raw = 0; raw <= 252; raw += 2) drag(raw);

      expect(seen).toEqual([...seen].sort((a, b) => a - b));
      expect(seen).toEqual([4, 12, 28, 60, 252]);
    });

    it('emits nothing when the value has not changed', () => {
      const seen: number[] = [];
      slider().valueChange.subscribe((value) => seen.push(value));

      drag(0);

      expect(seen).toEqual([]);
    });

    it('ignores a nudge too small to reach the next stop', () => {
      drag(1);

      expect(host.value).toBe(0);
    });

    it('steps one stop per arrow key, however wide the gap', () => {
      press('ArrowRight');
      expect(host.value).toBe(4);

      press('ArrowRight');
      expect(host.value).toBe(12);

      press('ArrowLeft');
      expect(host.value).toBe(4);
    });

    it('jumps to the ends with Home and End', () => {
      press('End');
      expect(host.value).toBe(252);

      press('Home');
      expect(host.value).toBe(0);
    });

    it('clamps at the ends', () => {
      press('ArrowLeft');
      expect(host.value).toBe(0);

      press('End');
      press('ArrowRight');
      expect(host.value).toBe(252);
    });

    it('moves freely when no stops are supplied', () => {
      host.snaps.set([]);
      fixture.detectChanges();

      drag(20);

      expect(host.value).toBe(20);
    });
  });
});

import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ScoreEntryGameComponent } from './score-entry-game.component';
import { buildGameEntry, setGameWinner } from './score-entry.form';

describe('ScoreEntryGameComponent', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [ScoreEntryGameComponent] });
    const fixture = TestBed.createComponent(ScoreEntryGameComponent);
    fixture.componentRef.setInput(
      'game',
      buildGameEntry(new FormBuilder(), {
        side1: ['pikachu'],
        side2: ['gengar'],
      }),
    );
    fixture.componentRef.setInput('sideNames', {
      side1: 'Team A',
      side2: 'Team B',
    });
    fixture.componentRef.setInput('label', 'Game 1');
    fixture.detectChanges();
    return fixture;
  }

  it('asks the disclosure to give its trailing row the free space', () => {
    const disclosure = render().nativeElement.querySelector('pdz-disclosure');

    expect(disclosure.getAttribute('data-trailing')).toBe('grow');
  });

  it('puts the replay field and winner in the disclosure trailing row', () => {
    const trailing = render().nativeElement.querySelector(
      '.pdz-disclosure__trailing',
    );

    expect(trailing.querySelector('.game__replay-input')).toBeTruthy();
    expect(trailing.querySelector('.game__winner')).toBeTruthy();
    expect(trailing.querySelector('.roster__score')).toBeNull();
  });

  it('puts each score input in its own team header, mirrored on the away side', () => {
    const headers =
      render().nativeElement.querySelectorAll('.roster__header');

    expect(headers.length).toBe(2);
    expect(headers[0].querySelector('.roster__score').getAttribute('aria-label')).toBe(
      'Team A score',
    );
    expect(headers[0].classList).not.toContain('roster__header--mirrored');
    expect(headers[1].querySelector('.roster__score').getAttribute('aria-label')).toBe(
      'Team B score',
    );
    expect(headers[1].classList).toContain('roster__header--mirrored');
  });

  it('marks the container with the winning side so the border can follow it', () => {
    const fixture = render();
    const disclosure = () =>
      fixture.nativeElement.querySelector('pdz-disclosure');

    expect(disclosure().getAttribute('data-winner')).toBeNull();

    setGameWinner(fixture.componentInstance.game(),'side2');
    fixture.detectChanges();

    expect(disclosure().getAttribute('data-winner')).toBe('side2');

    setGameWinner(fixture.componentInstance.game(),null);
    fixture.detectChanges();

    expect(disclosure().getAttribute('data-winner')).toBeNull();
  });

  it('reveals the analyze action inside the field only for a replay link', () => {
    const fixture = render();
    const analyze = () =>
      fixture.nativeElement.querySelector('.game__replay-action');

    expect(analyze()).toBeNull();

    fixture.componentInstance
      .game()
      .controls.link.setValue('replay.pokemonshowdown.com/gen9draft-1');
    fixture.detectChanges();

    expect(analyze()).toBeTruthy();
    expect(analyze().closest('.game__replay')).toBeTruthy();
  });
});

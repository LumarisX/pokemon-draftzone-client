import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { WebSocketService } from '../../services/ws.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HpChartComponent, HpOutcome } from './hp-chart/hp-chart.component';

@Component({
  selector: 'pdz-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, HpChartComponent],
})
export class CalculatorComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  calculatorForm!: FormGroup;
  calculationResult: any = null;
  payloadDebug: any = null;
  isLoading = false;
  error: string | null = null;

  maxHP: number = 0;
  smogonOutcomes: HpOutcome[] = [];
  dmgOutcomes: HpOutcome[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.ensureWebSocketConnected();
  }

  private initializeForm(): void {
    this.calculatorForm = this.fb.group({
      attacker: this.fb.group({
        name: ['Bisharp', Validators.required],
        move: ['Iron Head', Validators.required],
        item: [''],
        crit: [false],
        alwaysHits: [false],
        level: [100, Validators.min(1)],
        nature: [''],
        stats: this.fb.group({
          hp: [0, Validators.min(0)],
          atk: [0, Validators.min(0)],
          def: [0, Validators.min(0)],
          spa: [0, Validators.min(0)],
          spd: [0, Validators.min(0)],
          spe: [0, Validators.min(0)],
        }),
        evs: this.fb.group({
          hp: [0, [Validators.min(0), Validators.max(252)]],
          atk: [0, [Validators.min(0), Validators.max(252)]],
          def: [0, [Validators.min(0), Validators.max(252)]],
          spa: [0, [Validators.min(0), Validators.max(252)]],
          spd: [0, [Validators.min(0), Validators.max(252)]],
          spe: [0, [Validators.min(0), Validators.max(252)]],
        }),
        ivs: this.fb.group({
          hp: [31, [Validators.min(0), Validators.max(31)]],
          atk: [31, [Validators.min(0), Validators.max(31)]],
          def: [31, [Validators.min(0), Validators.max(31)]],
          spa: [31, [Validators.min(0), Validators.max(31)]],
          spd: [31, [Validators.min(0), Validators.max(31)]],
          spe: [31, [Validators.min(0), Validators.max(31)]],
        }),
      }),
      defender: this.fb.group({
        name: ['Deoxys-Defense', Validators.required],
        move: [''],
        item: [''],
        crit: [false],
        alwaysHits: [false],
        level: [100, Validators.min(1)],
        nature: [''],
        stats: this.fb.group({
          hp: [0, Validators.min(0)],
          atk: [0, Validators.min(0)],
          def: [0, Validators.min(0)],
          spa: [0, Validators.min(0)],
          spd: [0, Validators.min(0)],
          spe: [0, Validators.min(0)],
        }),
        evs: this.fb.group({
          hp: [0, [Validators.min(0), Validators.max(252)]],
          atk: [0, [Validators.min(0), Validators.max(252)]],
          def: [0, [Validators.min(0), Validators.max(252)]],
          spa: [0, [Validators.min(0), Validators.max(252)]],
          spd: [0, [Validators.min(0), Validators.max(252)]],
          spe: [0, [Validators.min(0), Validators.max(252)]],
        }),
        ivs: this.fb.group({
          hp: [31, [Validators.min(0), Validators.max(31)]],
          atk: [31, [Validators.min(0), Validators.max(31)]],
          def: [31, [Validators.min(0), Validators.max(31)]],
          spa: [31, [Validators.min(0), Validators.max(31)]],
          spd: [31, [Validators.min(0), Validators.max(31)]],
          spe: [31, [Validators.min(0), Validators.max(31)]],
        }),
      }),
    });
  }

  private ensureWebSocketConnected(): void {
    this.wsService
      .connect('battlezone')
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  calculate(): void {
    if (this.calculatorForm.invalid) {
      this.error = 'Please fill in required fields';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.calculationResult = null;

    const formValue = this.calculatorForm.value;
    const params = {
      attacker: {
        name: formValue.attacker.name,
        move: formValue.attacker.move,
        item: formValue.attacker.item || undefined,
        crit: formValue.attacker.crit,
        alwaysHits: formValue.attacker.alwaysHits,
        level: formValue.attacker.level,
        nature: formValue.attacker.nature || undefined,
        stats: formValue.attacker.stats,
        evs: formValue.attacker.evs,
        ivs: formValue.attacker.ivs,
      },
      defender: {
        name: formValue.defender.name,
        move: formValue.defender.move || undefined,
        item: formValue.defender.item || undefined,
        crit: formValue.defender.crit,
        alwaysHits: formValue.defender.alwaysHits,
        level: formValue.defender.level,
        nature: formValue.defender.nature || undefined,
        stats: formValue.defender.stats,
        evs: formValue.defender.evs,
        ivs: formValue.defender.ivs,
      },
    };

    console.log('Sending calculator request:', params);
    this.payloadDebug = params;

    this.wsService
      .sendMessage('calculator.calculate', params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.calculationResult = result;
          this.isLoading = false;
          console.log('Calculation result:', result);
          this.processChartData(result);
        },
        error: (err) => {
          this.error = err.message || 'Calculation failed';
          this.isLoading = false;
          console.error('Calculation error:', err);
        },
      });
  }

  private processChartData(result: any): void {
    console.log('Processing chart data:', result);

    // Extract Smogon outcomes
    if (
      result?.calculation?.smogon?.outcomes &&
      result.calculation.smogon.outcomes.length > 0
    ) {
      this.smogonOutcomes = result.calculation.smogon.outcomes;
      this.maxHP = Math.max(
        ...this.smogonOutcomes.map((o: HpOutcome) => o.hp),
        0,
      );
      console.log(
        `Smogon chart data: ${this.smogonOutcomes.length} outcomes, maxHp: ${this.maxHP}`,
      );
    } else {
      this.smogonOutcomes = [];
      this.maxHP = 0;
    }

    // Extract DMG outcomes
    if (
      result?.calculation?.dmg?.outcomes &&
      result.calculation.dmg.outcomes.length > 0
    ) {
      this.dmgOutcomes = result.calculation.dmg.outcomes;
      this.maxHP = result.calculation.defender.maxHP;
      console.log(
        `DMG chart data: ${this.dmgOutcomes.length} outcomes, maxHp: ${this.maxHP}`,
      );
    } else {
      this.dmgOutcomes = [];
      this.maxHP = result.calculation.defender.maxHP;
    }

    if (this.smogonOutcomes.length === 0 && this.dmgOutcomes.length === 0) {
      console.warn(
        'Could not extract any chart data from result. Result structure:',
        result,
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

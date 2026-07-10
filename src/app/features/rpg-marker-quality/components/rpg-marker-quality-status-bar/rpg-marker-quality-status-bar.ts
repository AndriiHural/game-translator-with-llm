import { Component, input } from '@angular/core';
import { FlowStep } from '../../classes/flow-step';

@Component({
  selector: 'app-rpg-marker-quality-status-bar',
  imports: [],
  templateUrl: './rpg-marker-quality-status-bar.html',
  styleUrl: './rpg-marker-quality-status-bar.scss',
})
export class RpgMarkerQualityStatusBar {
  /** Загальний прапор виконання флоу — для глобального спінера */
  isFlow1Procesing = input<boolean>(false);
  /** Список кроків флоу — рендериться як є, статус кожного кроку живий (signal) */
  steps = input<FlowStep[]>([]);
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-rpg-marker-quality-status-bar',
  imports: [],
  templateUrl: './rpg-marker-quality-status-bar.html',
  styleUrl: './rpg-marker-quality-status-bar.scss',
})
export class RpgMarkerQualityStatusBar {
  isFlow1Procesing = input<boolean>(false);
  isLineTypesValidationProcessing = input<boolean>(false);
  isDialogueTranslationProcessing = input<boolean>(false);
  isGlossaryOnlyProcessing = input<boolean>(false);
  isSystemMessagesProcessing = input<boolean>(false);
  isChooseFromVariantsProcessing = input<boolean>(false);
  isChooseSystemVariantProcessing = input<boolean>(false);
}

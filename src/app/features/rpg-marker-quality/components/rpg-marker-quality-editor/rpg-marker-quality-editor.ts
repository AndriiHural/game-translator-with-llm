import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Line, LineStatus, LineType } from '../../classes/line';
import { Gemma, UncensoredModel } from '../../../../constants/models';
import { PageHelper } from '../../helpers/page.helper';
import { naturalDialogueWithTargetPrompt, chooseVariant } from '../../constants/promps';
import { OllamaService } from '../../../../services/olama.service';

@Component({
  selector: 'app-rpg-marker-quality-editor',
  imports: [FormsModule],
  templateUrl: './rpg-marker-quality-editor.html',
  styleUrl: './rpg-marker-quality-editor.scss',
})
export class RpgMarkerQualityEditor {
  protected readonly LineType = LineType;
  protected readonly Gemma = Gemma;
  protected readonly Uncensored = UncensoredModel;

  private readonly ollamaService = inject(OllamaService);

  readonly lines = input.required<Line[]>();

  selectVariant(line: Line, model: string): void {
    line.parameters.update(prev => ({ ...prev, 0: line.variants()[model] }));
    line.status = LineStatus.Done;
  }

  async onGenerateVariants(lineId: number, model: string): Promise<void> {
    const promptBody = PageHelper.trassformToPromptBody(this.lines(), lineId);
    const prompt = `${naturalDialogueWithTargetPrompt}
    ${promptBody}`

    const result1 = await this.ollamaService.translate(prompt, model);
    console.log('result after retry', result1);

    PageHelper.saveAsVariants(result1, this.lines(), model);
  }

  async onChooseFromVariants(lineId: number): Promise<void> {
    const promptBody = PageHelper.trassformToPromptBody(this.lines(), lineId, true);
    const prompt = `${chooseVariant}
    ${promptBody}`

    const result = await this.ollamaService.translate(prompt, Gemma);
    console.log('result after retry', result);

    PageHelper.saveAsResult(result, this.lines());
  }
}

/**
 
 */
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
    line.parameters[0] = line.variants[model];
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
 * You are a literary editor. You are provided with an RPG dialogue that has already been translated into Ukrainian from Japanese. However, the current Ukrainian text sounds unnatural and reads like a literal translation (calque) from Japanese.

Your goal is to edit and refine this Ukrainian text to make it sound like natural, colloquial Ukrainian.

What needs to be changed:

Remove excessive Japanese politeness where it is inappropriate between friends. Instead of literal translations, use natural Ukrainian equivalents (idioms, phrasal expressions, interjections).

Replace awkward Ukrainian phrasing that sounds like a literal copy of Japanese structures (e.g., instead of "Нічого не вдієш" or "Це не може бути виправлено," use more contextually natural equivalents like "Тут вже нічого не вдієш" or "Я не можу в це повірити").

Rely on the character profiles to choose the correct grammatical gender and tone of speech in Ukrainian:
[INSERT CHARACTER PROFILE FILE CONTENT HERE]

Important: Keep the [ID: ...] tags and [br] line breaks exactly as they are. Do not add any commentary or notes of your own. Output only the edited Ukrainian text.

Here is the text:
    5|Name: Ірвін
6,7|Message: 「Талісман від біса![br]Добре, він ще тут був」
9|Name: Ірвін
10,11|Message: 「А? Але чомусь цей...」[br]「я не відчуваю магічної сили, як раніше...?」

 */
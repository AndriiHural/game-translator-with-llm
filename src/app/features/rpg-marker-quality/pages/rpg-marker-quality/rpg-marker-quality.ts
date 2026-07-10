import { ChangeDetectorRef, Component, computed, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { FileEditorService } from '../../../../services/file-editor.service';
import { Line, LineType } from '../../classes/line';
import { TranslateResult, TranslatorService } from '../../../../services/translate.service';
import { SceneEvent } from '../../classes/event';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { FILE_EXPORT_TOKEN } from '../../../../tokens/file-processor.tokens';
import { RpgMakerFileExportService } from '../../../../rpg-marker/services/rpg-maker-file-export.service';
import { NgClass } from '@angular/common';
import { PageHelper } from '../../helpers/page.helper';
import { OllamaService } from '../../../../services/olama.service';
import { Gemma, UncensoredModel } from '../../../../constants/models';
import { analyzeSceneContextPrompt, applySceneEmotionsPrompt, chooseSystemVariant, chooseVariant, classifyLineTypesPrompt, dialogueGlossaryOnlyPrompt, editSystemMessagePrompt, fitTextToLimitsPrompt, naturalDialoguePrompt, selectAndValidateDialogueRowPrompt } from '../../constants/prompt';
import { RpgMarkerQualityEditor } from '../../components/rpg-marker-quality-editor/rpg-marker-quality-editor';
import { EventCommandCode } from '../../enums/event-comand-code.enum';
import { form, FormField } from '@angular/forms/signals';
import { MatDividerModule } from '@angular/material/divider';
import { async } from 'rxjs';
import { RpgMarkerQualityStatusBar } from "../../components/rpg-marker-quality-status-bar/rpg-marker-quality-status-bar";
import { Page } from '../../classes/page';
import { FlowStep, FlowStepStatus } from '../../classes/flow-step';
import { GlossaryEntry } from '../../classes/glossary-entry';
import { GlossaryGeneratorService } from '../../services/glossary-generator.service';

@Component({
  selector: 'app-rpg-marker-quality',
  imports: [MatSelectModule, FormsModule, NgClass, RpgMarkerQualityEditor, FormField, MatDividerModule, RpgMarkerQualityStatusBar],
  providers: [TranslatorService],
  templateUrl: './rpg-marker-quality.html',
  styleUrl: './rpg-marker-quality.scss',
})
export class RpgMarkerQuality {
  protected readonly LineType = LineType;
  protected readonly EventCommandCode = EventCommandCode;

  private fileExportService = inject(FILE_EXPORT_TOKEN);
  private fileEditorService = inject(FileEditorService);
  private ollamaService = inject(OllamaService);
  private glossaryGenerator = inject(GlossaryGeneratorService);
  private cdr = inject(ChangeDetectorRef);

  protected glossaryFileInput = viewChild.required<ElementRef<HTMLInputElement>>('glossaryFileInput');

  isFlow1Procesing = signal<boolean>(false);
  isGlossaryGenerating = signal<boolean>(false);
  glossaryProgress = signal<{ done: number; total: number }>({ done: 0, total: 0 });

  // Проміжний результат аналізу сцени, який споживає крок емоцій
  private sceneAnalysis = '';

  // Єдине джерело правди для onFlow1 та статус-бару.
  // Щоб додати крок — додай сюди один запис (порожній label покаже плейсхолдер у барі).
  readonly flowSteps: FlowStep[] = [
    { key: 'lineTypes', label: 'Валідація типів рядків', status: signal<FlowStepStatus>('pending'), run: () => this.checkLineTypes() },
    { key: 'natural', label: 'Художній переклад діалогів', status: signal<FlowStepStatus>('pending'), run: () => this.translateToNaturalDialogue() },
    { key: 'system', label: 'Обробка системних повідомлень', status: signal<FlowStepStatus>('pending'), run: () => this.editSystemMessage() },
    { key: 'choose', label: 'Генерація та вибір варіантів ШІ', status: signal<FlowStepStatus>('pending'), run: () => this.chooseAllMessageVariants() },
    { key: 'tags', label: 'Валідація тегів RPG Maker', status: signal<FlowStepStatus>('pending'), run: () => this.checkTagValidation() },
    { key: 'glossary', label: 'Фіналізація за глосарієм', status: signal<FlowStepStatus>('pending'), run: () => this.translateWithGlossary() },
    { key: 'analyze', label: 'Аналіз сцени', status: signal<FlowStepStatus>('pending'), run: async () => { this.sceneAnalysis = await this.analyzeScene(); } },
    { key: 'emotions', label: 'Емоційне забарвлення', status: signal<FlowStepStatus>('pending'), run: () => this.applySceneEmotions(this.sceneAnalysis) },
    { key: 'fit', label: 'Підгонка під ліміти', status: signal<FlowStepStatus>('pending'), run: () => this.fitTextToLimits() },
    { key: 'finalTags', label: 'Фінальна нормалізація тегів', status: signal<FlowStepStatus>('pending'), run: () => this.checkTagValidation() },
  ];


  originalLines = signal<Array<Line>>([]);
  editedLines = signal<Array<Line>>([]);
  currentMapId = signal<string>('');
  currentMapName = signal<string>('');
  olamaResponse = signal<TranslateResult | null>(null);

  mapList = signal<Array<any>>([]);
  selectedMapId = signal<string>('');

  uploadedList = signal<Array<SceneEvent>>([]);
  // TODO Add other text lines codes
  // Структурні фільтри (чи є в сторінці текстові рядки) читаємо через untracked,
  // щоб додавання рядка не перераховувало eventList/pageList і не смикало ефект-скидання вибору.
  eventList = computed(() => this.uploadedList()?.filter(event => this.onlyTextFilter() ? untracked(() => event.pages.some(page => page.list().some(line => line.code === EventCommandCode.TextLine))) : true) || [] as SceneEvent[]);
  pageList = computed(() => this.eventList()[this.selectedEventId()]?.pages.filter(page => this.onlyTextFilter() ? untracked(() => page.list().some(line => line.code === EventCommandCode.TextLine)) : true) || [] as Page[]);
  // lineList навмисно читає list() з відстеженням — саме він рендерить рядки й має оновлюватись при addLine.
  // Завжди повертає масив (?? []), бо на ньому викликається .filter у кроках флоу і .length у шаблоні.
  lineList = computed(() => {
    const list = this.pageList()[this.selectedPageId()]?.list() ?? [];
    return Object.values(this.codes()).some(Boolean)
      ? list.filter(line => this.codes()[line.code as EventCommandCode.ShowText | EventCommandCode.TextLine])
      : list;
  });



  selectedEventId = signal<number>(0);
  selectedPageId = signal<number>(0);
  onlyTextFilter = signal<boolean>(true);
  codes = signal({ [EventCommandCode.ShowText]: true, [EventCommandCode.TextLine]: true });

  selectedEvent = signal<SceneEvent | null>(null);

  files = signal<File[] | null>(null);

  activeFileContent: object | null = null;
  glossaryFileContent = signal<object | null>(null);

  codesForm = form(this.codes)

  constructor() {
    // effect(() => {
    //   const currentMap = this.mapList()[this.selectedMapId()] || {} as MapData;
    //   this.currentMapId.set(this.selectedMapId());
    //   this.currentMapName.set(currentMap.name || 'Untitled');
    //   this.extractAndSetLines();
    // });

    effect(() => {
      this.eventList();
      console.log('eventList', this.eventList());
      this.selectedEventId.set(0);
      this.selectedPageId.set(0);
    });

    effect(() => {
      console.log('pageList', this.pageList());
      console.log('this.selectedPageId()', this.selectedPageId());

    })
  }

  async onOpenOneFile() {
    try {
      const fileContent = await this.fileEditorService.openFile();
      this.parseAndProcessFile({ name: '', content: JSON.parse(fileContent) });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async saveOneFile() {
    if (!this.activeFileContent) {
      return;
    }
    const updatedEvents = this.uploadedList().map(event => event ? event.toJSON() : null);
    const updatedContent = {
      ...this.activeFileContent,
      events: updatedEvents
    };
    const content = JSON.stringify(updatedContent);
    const contertForDownload = (this.fileExportService as unknown as RpgMakerFileExportService).getReformatExistingFile(content, "Збережений файл");
    this.fileEditorService.saveFile(contertForDownload);
  }

  async onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      return;
    }
    console.log('target.files', Array.from(target.files));
    this.files.set(Array.from(target.files));

    try {
      const result = await this.readFile(target.files[0]);

      this.parseAndProcessFile(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      target.value = '';
    }
  }

  saveFile() {
    if (!this.activeFileContent || !this.files()?.length) {
      return;
    }
    const updatedEvents = this.uploadedList().map(event => event ? event.toJSON() : null);
    const updatedContent = {
      ...this.activeFileContent,
      events: updatedEvents
    };
    const content = JSON.stringify(updatedContent);
    const contertForDownload = (this.fileExportService as unknown as RpgMakerFileExportService).getReformatExistingFile(content, this.files()![0].name);
    this.fileExportService.downloadBlob(contertForDownload, this.files()![0].name);
  }

  copyToClipboard() {
    if (!this.activeFileContent) {
      return;
    }
    const updatedEvents = this.uploadedList().map(event => event ? event.toJSON() : null);
    const updatedContent = {
      ...this.activeFileContent,
      events: updatedEvents
    };
    const content = JSON.stringify(updatedContent);
    const contertForDownload = (this.fileExportService as unknown as RpgMakerFileExportService).getReformatExistingFile(content, '');
    navigator.clipboard.writeText(contertForDownload);
  }

  onEventSelected(event: MatSelectChange<number>) {
    console.log(event.value);
    this.selectedEventId.set(event.value);
    // При зміні події перемикаємось на першу сторінку (фільтри застосуються автоматично через lineList)
    this.selectedPageId.set(0);
  }

  onPageSelected(event: MatSelectChange<number>) {
    console.log(event.value);
    this.selectedPageId.set(event.value);
  }

  async onFlow1() {
    this.isFlow1Procesing.set(true);
    this.flowSteps.forEach(step => step.status.set('pending'));

    try {
      for (const step of this.flowSteps) {
        step.status.set('processing');
        try {
          await step.run();
          step.status.set('completed');
        } catch (error) {
          step.status.set('error');
          console.error(`[onFlow1] крок "${step.key}" впав:`, error);
          break; // зупиняємо флоу на першій помилці
        }
      }
    } finally {
      this.isFlow1Procesing.set(false);
    }
  }

  /**
   * Генерація та вибір найкращого варіанту для кожної репліки (Message).
   * Крок 'choose' у flowSteps.
   */
  async chooseAllMessageVariants(): Promise<void> {
    const lineIds = this.lineList().filter(line => [LineType.Message].includes(line.type())).map(line => line.id);
    for (let i = 0; i < lineIds.length; i++) {
      console.log('Processing line:', i + 1, '/', lineIds.length);
      await this.onChooseFromVariants(lineIds[i], chooseVariant);
    }
  }

  async onChooseFromVariants(lineId: number, promptBuilder: (context: string) => string): Promise<void> {
    const promptBody = PageHelper.trassformToPromptBody(this.lineList(), lineId, true);
    const prompt = promptBuilder(promptBody);

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.ollamaService.translate(prompt, Gemma);
      console.log('result attempt', attempt, '/', maxRetries, result);

      try {
        PageHelper.saveAsResult(result, this.lineList());
        return;
      } catch (error) {
        console.warn(`onChooseFromVariants: спроба ${attempt}/${maxRetries} невдала, повторюємо запит`, error);
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
  }

  /**
   * AI actions
   */

  /**
   * Перетворює діалоги на більш природні
   */
  async translateToNaturalDialogue(): Promise<void> {
    const lines = this.lineList().filter(line => [LineType.Message].includes(line.type()));
    const promptBody = PageHelper.trassformToPromptBody(lines);
    const prompt = `${naturalDialoguePrompt}
    ${promptBody}`

    const result1 = await this.ollamaService.translate(prompt, Gemma);
    console.log('result1', result1);

    PageHelper.saveAsVariants(result1, lines, Gemma);

    const result2 = await this.ollamaService.translate(prompt, Gemma, { temperature: 0.2, top_p: 0.6 });
    console.log('result2', result2);

    PageHelper.saveAsVariants(result2, lines, UncensoredModel);
  }

  /**
   * Перевіряє діалоги на правильність тегів
   */
  async checkTagValidation() {
    const lines = this.lineList().filter(line => [LineType.Name, LineType.Message, LineType.Other].includes(line.type()));
    const promptBody = PageHelper.trassformToPromptBody(lines);
    const prompt = `${selectAndValidateDialogueRowPrompt}
    ${promptBody}`

    const result1 = await this.ollamaService.translate(prompt, Gemma);
    console.log('result1', result1);

    PageHelper.saveAsResult(result1, lines);
    console.log('lines after flow 1', this.lineList())
  }

  /**
   * Перевіряє діалоги на правильність імен та слів з глосарієм
   */
  async translateWithGlossary() {
    if (!this.glossaryFileContent()) {
      // Чекаємо, поки користувач вибере файл глосарія (або скасує діалог)
      await this.waitForGlossaryUpload();
    }
    if (!this.glossaryFileContent()) {
      // Глосарій так і не завантажено — пропускаємо крок, щоб не слати "null" у модель
      console.warn('translateWithGlossary: глосарій не завантажено, крок пропущено');
      return;
    }
    console.log('lines before translateWithGlossary', this.lineList())
    const lines = this.lineList();
    const promptBody = PageHelper.trassformToPromptBody(lines);
    const prompt = dialogueGlossaryOnlyPrompt(JSON.stringify(this.glossaryFileContent()), promptBody)
    console.log('prompt with glossary', prompt);

    const result = await this.ollamaService.translate(prompt, Gemma);
    console.log('[Glossary] result', result);

    PageHelper.saveAsResult(result, lines);
  }

  /**
   * Генерує/оновлює глосарій з діалогу всього файлу і завантажує результат як JSON.
   */
  async generateGlossary(): Promise<void> {
    this.isGlossaryGenerating.set(true);
    this.glossaryProgress.set({ done: 0, total: 0 });
    try {
      const existing = this.glossaryFileContent();
      const merged = await this.glossaryGenerator.generate(
        this.uploadedList(),
        Array.isArray(existing) ? existing as GlossaryEntry[] : [],
        (done, total) => this.glossaryProgress.set({ done, total })
      );
      const json = JSON.stringify(merged, null, 2);
      (this.fileExportService as unknown as RpgMakerFileExportService).downloadBlob(json, 'glossary.merged.json');
    } catch (error) {
      console.error('generateGlossary: помилка генерації глосарію', error);
    } finally {
      this.isGlossaryGenerating.set(false);
    }
  }


  /**
   * Редагує системні повідомлення
   */
  async editSystemMessage(): Promise<void> {
    const lines = this.lineList().filter(line => [LineType.Other, LineType.Message, LineType.Name].includes(line.type()));
    const systemLines = this.lineList().filter(line => [LineType.Other].includes(line.type()));

    for (let i = 0; i < systemLines.length; i++) {
      const systemLine = systemLines[i];
      const promptBody = PageHelper.trassformToPromptBody(lines, systemLine.id);
      const prompt = editSystemMessagePrompt(promptBody)

      const result1 = await this.ollamaService.translate(prompt, Gemma);
      console.log('[Edit System Message] result1', result1);

      PageHelper.saveAsVariants(result1, lines, Gemma);

      const result2 = await this.ollamaService.translate(prompt, Gemma, { temperature: 0.2, top_p: 0.6 });
      console.log('[Edit System Message] result2', result2);

      PageHelper.saveAsVariants(result2, lines, UncensoredModel);
    }

    const lineIds = systemLines.map(line => line.id);
    for (let i = 0; i < lineIds.length; i++) {
      const id = lineIds[i];
      console.log('Processing line:', i + 1, '/', lineIds.length);
      await this.onChooseFromVariants(id, chooseSystemVariant);
    }
  }


  /**
   * Перевіряє типи повідомлень
   */
  async checkLineTypes(): Promise<void> {
    const lines = this.lineList().filter(line => [LineType.Other, LineType.Message, LineType.Name].includes(line.type()));
    const promptBody = PageHelper.getLinesForTypeCheck(lines);
    const prompt = classifyLineTypesPrompt(promptBody)

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.ollamaService.translate(prompt, Gemma);
      console.log('[Check Line Types] attempt', attempt, '/', maxRetries, result);

      const parsed = PageHelper.parseJsonArray<{ id: number, type: string, line: string, isChanged: boolean }>(result);
      if (parsed) {
        PageHelper.changeLinesType(parsed, lines);
        return;
      }

      console.warn(`checkLineTypes: спроба ${attempt}/${maxRetries} — невалідний JSON, повторюємо запит`);
    }

    throw new Error('checkLineTypes: не вдалося отримати валідний JSON після повторів');
  }

  /**
   * Аналізує сцену
   */
  async analyzeScene(): Promise<string> {
    const lines = this.lineList().filter(line => [LineType.Other, LineType.Message, LineType.Name].includes(line.type()));
    const promptBody = PageHelper.trassformToPromptBody(lines);
    const prompt = analyzeSceneContextPrompt(promptBody)

    const result = await this.ollamaService.translate(prompt, Gemma);

    // type 
    //   {
    //   scene_summary: string,
    //   character_list: string[],
    //   proper_nouns_and_items: string[],
    //   emotional_timeline: string
    // }
    return result;
  }

  /**
   * Застосовує емоції до діалогу
   */
  async applySceneEmotions(sceneSummary: string): Promise<void> {
    const targetLines = this.lineList().filter(line => [LineType.Message, LineType.Name].includes(line.type()));
    console.log('targetLines', targetLines);
    const messages = PageHelper.trassformToPromptBody(targetLines)
      .split('\n')
      .filter(line => line.includes('|Message:'));
    console.log('messages', messages);
    for (let i = 0; i < messages.length; i++) {
      const promptBody = messages[i];
      const prompt = applySceneEmotionsPrompt(sceneSummary, promptBody)

      const result = await this.ollamaService.translate(prompt, Gemma, { temperature: 0.7, top_p: 0.9 });
      console.log('[Apply Scene Emotions] result', result);

      PageHelper.saveAsResult(result, this.lineList());
    }

  }

  /**
   * Примусова переформатація тексту
   */
  async fitTextToLimits(): Promise<void> {
    const targetLines = this.lineList().filter(line => [LineType.Message, LineType.Name].includes(line.type()));
    const messages = PageHelper.trassformToPromptBody(targetLines)
      .split('\n')
      .filter(line => line.includes('|Message:'));
    console.log('messages', messages);
    for (let i = 0; i < messages.length; i++) {
      const promptBody = messages[i];
      const prompt = fitTextToLimitsPrompt(promptBody);

      const result = await this.ollamaService.translate(prompt, Gemma, { temperature: 0, top_p: 0.1 });

      console.log('[Fit Text To Limits] result', result);

      PageHelper.saveAsResult(result, this.lineList(), this.pageList()[this.selectedPageId()]);
    }

    console.log('page after fix', this.pageList()[this.selectedPageId()]);
    this.cdr.detectChanges();
  }

  async applySceneEmotionsWithAnalyse(): Promise<void> {
    const sceneSummary = await this.analyzeScene();
    this.applySceneEmotions(sceneSummary)
  }


  private readFile(file: File): Promise<{ name: string, content: any }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const content = e.target.result;

          resolve({
            name: file.name,
            content: JSON.parse(content),
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }

  private async parseAndProcessFile({ content }: { name: string, content: any }) {
    const events: SceneEvent[] = [];
    console.log('content', content);
    this.activeFileContent = content;
    content.events.forEach((event: SceneEvent) => {
      console.log('event', event);
      events.push(new SceneEvent(event));
    });
    console.log('events', events);

    // Автоматично вибираємо id евента як поточний
    if (events.length > 1) {
      if (events[0] !== null) {
        this.selectedEventId.set(events[1].id);
      }
    }

    this.uploadedList.set(events);

    console.log('Event list', events);
  }

  onUploadGlossary(): void {
    this.glossaryFileInput().nativeElement.click()
  }

  private finishGlossaryWait: (() => void) | null = null;

  /**
   * Відкриває діалог вибору файлу глосарія і повертає Promise,
   * який резолвиться після завантаження файлу (setGlossary) або скасування діалогу.
   */
  private waitForGlossaryUpload(): Promise<void> {
    return new Promise<void>((resolve) => {
      const input = this.glossaryFileInput().nativeElement;

      const onCancel = () => this.finishGlossaryWait?.();

      // Єдина точка завершення: знімає слухача і резолвить проміс (лише раз)
      this.finishGlossaryWait = () => {
        input.removeEventListener('cancel', onCancel);
        this.finishGlossaryWait = null;
        resolve();
      };

      input.addEventListener('cancel', onCancel, { once: true });
      input.click();
    });
  }

  async setGlossary(event: Event): Promise<void> {
    const uploadedFile = this.uploadFileFromInput(event);

    try {
      const result = await this.readFile(uploadedFile);

      this.glossaryFileContent.set(result.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Розблоковуємо translateWithGlossary, якщо він чекає на вибір файлу
      this.finishGlossaryWait?.();
    }
  }

  private uploadFileFromInput(event: Event): File {
    const target = event.target as HTMLInputElement;

    if (!target.files || target.files.length === 0) {
      throw new Error('No file selected');
    }

    const file = target.files[0];
    target.value = '';

    return file;
  }

}



/** 
You are an expert game localizer and technical text editor.

Your task is to optimize the provided dialogue line (marked as TARGET ROW) so that it strictly fits within the technical constraints of the game's text box, while preserving the maximum possible context.

Strict Constraints & Rules:
1. Max 42 Characters per Line: Every single text line must contain AT MOST 42 characters (including spaces, punctuation, and brackets like 「」 or «»).
2. Max 3 Lines Total: The entire message can have a maximum of 3 lines after formatting.
3. Handling the Existing [br] Tag & Line Order:
   - The [br] tag represents a strict hard screen-break or a chronological pause. 
   - CRITICAL: Never move sentences or text blocks that are AFTER the [br] tag to the section BEFORE the [br] tag (No pulling text up). Exception: short ambient exclamations like "Ох...", "Ах...", "Ха-ха".
   - If the text BEFORE the [br] tag is too long, you can push its trailing words DOWN to a new line (using a newline \n), but do NOT mix it with the text after [br].
   - You MUST preserve the [br] tag itself in the final output exactly where it belongs logically. Never delete it.
4. Adding Soft Line Breaks (Newlines): If a line exceeds 42 characters, you are explicitly allowed to split it by inserting a standard newline character (press Enter / \n) to wrap the text onto the next line, as long as the total number of lines does not exceed 3.
   - CRITICAL: Do NOT invent or add new [br] tags. Only use standard line breaks.
5. Smart Condensation: If the text still exceeds the limits (42 chars per line, max 3 lines), carefully shorten it by using shorter synonyms or removing redundant words, while maintaining the core meaning and emotional tone.

Technical Formatting Rules:
- Process ONLY the text inside the quotes of the **TARGET ROW**. Keep the ID intact.
- Do NOT alter engine tags like \V[n] or \N[n] (they count as 4 characters for your length estimation).
- Preserve the "♥" symbol if present.
- Do NOT add any explanations, character counts, or notes. Return only the single processed row.

**TARGET ROW**
2,3|Message: "Хоча відправлення дослідницької групи вже і так\n удар по ресурсах,
 */
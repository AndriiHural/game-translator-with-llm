import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { chooseVariant, naturalDialoguePrompt, selectAndValidateDialogueRowPrompt } from '../../constants/promps';
import { RpgMarkerQualityEditor } from '../../components/rpg-marker-quality-editor/rpg-marker-quality-editor';
import { EventCommandCode } from '../../enums/event-comand-code.enum';
import { form, FormField } from '@angular/forms/signals';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-rpg-marker-quality',
  imports: [MatSelectModule, FormsModule, NgClass, RpgMarkerQualityEditor, FormField, MatDividerModule],
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

  originalLines = signal<Array<Line>>([]);
  editedLines = signal<Array<Line>>([]);
  currentMapId = signal<string>('');
  currentMapName = signal<string>('');
  olamaResponse = signal<TranslateResult | null>(null);

  mapList = signal<Array<any>>([]);
  selectedMapId = signal<string>('');

  uploadedList = signal<Array<SceneEvent>>([]);
  // TODO Add other text lines codes
  eventList = computed(() => this.uploadedList()?.filter(event => this.onlyTextFilter() ? event.pages.some(page => page.list.some(line => line.code === EventCommandCode.TextLine)) : true) || []);
  pageList = computed(() => this.eventList()[this.selectedEventId()]?.pages.filter(page => this.onlyTextFilter() ? page.list.some(line => line.code === EventCommandCode.TextLine) : true) || []);
  lineList = computed(() => Object.values(this.codes()).some(Boolean) ? this.pageList()[this.selectedPageId()]?.list.filter(line => this.codes()[line.code as EventCommandCode.ShowText | EventCommandCode.TextLine]) : this.pageList()[this.selectedPageId()]?.list || []);

  selectedEventId = signal<number>(0);
  selectedPageId = signal<number>(0);
  onlyTextFilter = signal<boolean>(true);
  codes = signal({ [EventCommandCode.ShowText]: true, [EventCommandCode.TextLine]: true });

  selectedEvent = signal<SceneEvent | null>(null);

  files = signal<File[] | null>(null);

  activeFileContent: object | null = null;

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
    const content = JSON.stringify(this.activeFileContent);
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
    const content = JSON.stringify(this.activeFileContent);
    const contertForDownload = (this.fileExportService as unknown as RpgMakerFileExportService).getReformatExistingFile(content, this.files()![0].name);
    this.fileExportService.downloadBlob(contertForDownload, this.files()![0].name);

  }

  copyToClipboard() {
    const content = JSON.stringify(this.activeFileContent);
    const contertForDownload = (this.fileExportService as unknown as RpgMakerFileExportService).getReformatExistingFile(content, this.files()![0].name);
    navigator.clipboard.writeText(contertForDownload);
  }

  onEventSelected(event: MatSelectChange<number>) {
    console.log(event.value);
    this.selectedEventId.set(event.value);
  }

  onPageSelected(event: MatSelectChange<number>) {
    console.log(event.value);
    this.selectedPageId.set(event.value);
  }

  async onFlow1() {
    await this.translateToNaturalDialogue();

    const lineIds = this.lineList().filter(line => line.type === LineType.Message || line.type === LineType.Name).map(line => line.id);
    for (let i = 0; i < lineIds.length; i++) {
      const id = lineIds[i];
      console.log('Processing line:', i + 1, '/', lineIds.length);
      await this.onChooseFromVariants(id);
    }

    await this.checkTagValidation();
  }

  async onChooseFromVariants(lineId: number): Promise<void> {
    const promptBody = PageHelper.trassformToPromptBody(this.lineList(), lineId, true);
    const prompt = `${chooseVariant}
      ${promptBody}`

    const result = await this.ollamaService.translate(prompt, Gemma);
    console.log('result after retry', result);

    PageHelper.saveAsResult(result, this.lineList());
  }

  /**
   * AI actions
   */

  /**
   * Перетворює діалоги на більш природні
   */
  async translateToNaturalDialogue(): Promise<void> {
    const lines = this.pageList().flatMap(page => page.list).filter(line => line.type === LineType.Message || line.type === LineType.Name);
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

  async checkTagValidation() {
    const lines = this.pageList().flatMap(page => page.list).filter(line => line.type === LineType.Message || line.type === LineType.Name);
    const promptBody = PageHelper.trassformToPromptBody(lines);
    const prompt = `${selectAndValidateDialogueRowPrompt}
    ${promptBody}`

    const result1 = await this.ollamaService.translate(prompt, Gemma);
    console.log('result1', result1);

    PageHelper.saveAsResult(result1, lines);
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
}

/** 
 * 
 */
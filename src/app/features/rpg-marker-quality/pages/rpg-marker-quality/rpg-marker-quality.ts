import { Component, effect, inject, signal } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';
import { OllamaService } from '../../../../services/olama.service';
import { Gemma, UncensoredModel } from '../../../../constants/models';
import { naturalDialoguePrompt } from '../../constants/promps';
import { RpgMarkerQualityEditor } from '../../components/rpg-marker-quality-editor/rpg-marker-quality-editor';

@Component({
  selector: 'app-rpg-marker-quality',
  imports: [MatSelectModule, FormsModule, NgClass, RpgMarkerQualityEditor],
  providers: [TranslatorService],
  templateUrl: './rpg-marker-quality.html',
  styleUrl: './rpg-marker-quality.scss',
})
export class RpgMarkerQuality {
  protected readonly LineType = LineType;

  private fileExportService = inject(FILE_EXPORT_TOKEN);
  private fileEditor = inject(FileEditorService);
  private olamaService = inject(OllamaService);

  originalLines = signal<Array<Line>>([]);
  editedLines = signal<Array<Line>>([]);
  currentMapId = signal<string>('');
  currentMapName = signal<string>('');
  olamaResponse = signal<TranslateResult | null>(null);

  mapList = signal<Array<any>>([]);
  selectedMapId = signal<string>('');

  eventList = signal<Array<SceneEvent>>([]);
  selectedEventId = signal<number>(0);
  selectedPageId = signal<number>(0);

  selectedEvent = signal<SceneEvent | null>(null);

  files = signal<File[] | null>(null);

  activeFileContent: object | null = null;

  constructor() {
    // effect(() => {
    //   const currentMap = this.mapList()[this.selectedMapId()] || {} as MapData;
    //   this.currentMapId.set(this.selectedMapId());
    //   this.currentMapName.set(currentMap.name || 'Untitled');
    //   this.extractAndSetLines();
    // });
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

  /**
   * AI actions
   */

  /**
   * Перетворює діалоги на більш природні
   */
  async translateToNaturalDialogue(): Promise<void> {
    const lines = this.eventList()[this.selectedEventId()].getLinesForPage(this.selectedPageId());
    const promptBody = PageHelper.trassformToPromptBody(lines);
    const prompt = `${naturalDialoguePrompt}
    ${promptBody}`

    const result1 = await this.olamaService.translate(prompt, Gemma);
    console.log('result1', result1);

    PageHelper.trassformOlamaResult(result1, lines, Gemma);

    const result2 = await this.olamaService.translate(prompt, UncensoredModel);
    console.log('result2', result2);

    PageHelper.trassformOlamaResult(result2, lines, UncensoredModel);
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

    this.eventList.set(events);

    console.log('Event list', events);
  }



  // async saveFile() {
  //   if (!this.editedLines().length || !this.selectedEventId()) {
  //     this.error.set('Немає даних для збереження');
  //     return;
  //   }

  //   this.loading.set(true);
  //   this.error.set(null);

  //   try {
  //     // 1. Отримуємо всі події, щоб знайти поточну
  //     const events = this.eventList();
  //     const currentEventIndex = events.findIndex(e => e.id === this.selectedEventId());

  //     if (currentEventIndex === -1) {
  //       throw new Error('Поточну подію не знайдено в списку');
  //     }

  //     // 2. Оновлюємо параметри в поточній події
  //     const updatedEvent: EventData = {
  //       ...events[currentEventIndex],
  //       events: this.editedLines()
  //     };

  //     // 3. Замінюємо стару подію новою
  //     const updatedEvents = [...events];
  //     updatedEvents[currentEventIndex] = updatedEvent;
  //     this.eventList.set(updatedEvents);

  //     // 4. Парсимо події назад у текст
  //     const newBuffer = this.exporter.exportToBuffer(updatedEvents);

  //     // 5. Зберігаємо файл через File System Access API
  //     await this.fileEditor.saveFile(newBuffer.toString());

  //     console.log('✅ Дані успішно збережено');
  //   } catch (error) {
  //     this.error.set(this.getErrorMessage(error));
  //   } finally {
  //     this.loading.set(false);
  //   }
  // }

  // private extractAndSetLines() {
  //   const currentEventId = this.selectedEventId();
  //   if (!currentEventId) {
  //     this.originalLines.set([]);
  //     this.editedLines.set([]);
  //     return;
  //   }

  //   const event = this.eventList().find(e => e.id === currentEventId);
  //   if (!event) {
  //     this.originalLines.set([]);
  //     this.editedLines.set([]);
  //     return;
  //   }

  //   this.originalLines.set([...event.events]);
  //   this.editedLines.set(JSON.parse(JSON.stringify(event.events)));
  // }

  // onMapSelected(event: Event) {
  //   const select = event.target as HTMLSelectElement;
  //   this.selectedMapId.set(select.value);
  // }



  // updateResponse(event: Event) {
  //   const value = (event.target as HTMLTextAreaElement).value;
  //   const response = this.olamaResponse() || { rowResponse: '', rowIssues: [] };
  //   this.olamaResponse.set({ ...response, rowResponse: value });
  // }
}

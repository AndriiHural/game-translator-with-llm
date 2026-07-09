import { Injectable, inject } from '@angular/core';
import { FILE_PARSER_TOKEN } from '../../tokens/file-processor.tokens';
import { RpgMakerFileParserService } from './rpg-maker-file-parser.service';
import { IFileExport } from '../../tokens/file-processor.type';

@Injectable()
export class RpgMakerFileExportService implements IFileExport {
  private parser = inject(FILE_PARSER_TOKEN) as RpgMakerFileParserService;

  exportFile(csvContent: string[][], fileName: string, originalContent?: string): void {
    if (!originalContent) return;

    const updatedJson = JSON.parse(JSON.stringify(originalContent));

    csvContent.forEach((row, rowIndex) => {
      const jsonPath = row[0];
      const translatedText = row[2];

      // Перевіряємо валідність рядка таблиці
      if (!jsonPath || !translatedText) return;

      const normalizedPath = jsonPath
        .replace(/\[/g, '.')
        .replace(/\]/g, '')
        .replace(/^\./, '');

      const keys = normalizedPath.split('.');
      let current = updatedJson;

      try {
        for (let i = 0; i < keys.length - 1; i++) {
          let key: string | number = keys[i];
          if (!isNaN(Number(key))) key = Number(key);

          // 👈 ДОДАТКОВИЙ ЗАХИСТ: Перевіряємо, чи current взагалі є об'єктом, перш ніж брати ключ
          if (!current || typeof current !== 'object' || current[key] === undefined) {
            throw new Error(`Invalid path step: "${key}"`);
          }
          current = current[key];
        }

        let lastKey = keys[keys.length - 1];
        if (!isNaN(Number(lastKey))) lastKey = Number(lastKey) as unknown as string;

        // Перевіряємо фінальний вузол перед записом
        if (current && typeof current === 'object') {
          current[lastKey] = translatedText;
        }
      } catch (err) {
        // Логуємо проблемний рядок, але не зупиняємо експорт всього файлу
        console.warn(`[Export Warning] Пропущено бітий рядок таблиці #${rowIndex}. Шлях: "${jsonPath}".`, err);
      }
    });

    // 1. Генеруємо стандартний JSON рядок
    let finalContent = this.preperFile(updatedJson);

    this.downloadBlob(finalContent, fileName);
  }

  /**
 * Метод для швидкого переформатування вже перекладених файлів
 * Приймає сирий зчитаний текст файлу (який зараз в один рядок)
 */
  reformatExistingFile(rawJsonText: string, fileName: string): void {
    const formatFile = this.getReformatExistingFile(rawJsonText, fileName);
    this.downloadBlob(formatFile, fileName);
  }

  getReformatExistingFile(rawJsonText: string, fileName: string): string {
    try {
      // 1. Парсимо старий завантажений JSON, який зараз записаний в один рядок
      const updatedJson = JSON.parse(rawJsonText);

      // ПОЧАТОК НАШОЇ ГІБРИДНОЇ ЗБІРКИ
      const pieces: string[] = [];

      // Збираємо базові метадані (все, крім data та events)
      const metaObj: any = {};
      for (const key in updatedJson) {
        if (updatedJson.hasOwnProperty(key) && key !== 'data' && key !== 'events') {
          metaObj[key] = updatedJson[key];
        }
      }

      // Перетворюємо мету в один рядок і зрізаємо зовнішні { }
      let metaString = JSON.stringify(metaObj);
      metaString = metaString.substring(1, metaString.length - 1);
      if (metaString) {
        pieces.push(metaString);
      }

      // 1. Масив "data" (строго в один рядок)
      if (updatedJson.hasOwnProperty('data')) {
        const dataString = `"data":${JSON.stringify(updatedJson.data)}`;
        pieces.push(dataString);
      }

      // 2. Масив "events" (кожен івент з нового рядка БЕЗ пробілів)
      if (updatedJson.hasOwnProperty('events') && Array.isArray(updatedJson.events)) {
        const eventPieces: string[] = [];

        updatedJson.events.forEach((event: any) => {
          if (event === null) {
            eventPieces.push('null');
          } else {
            eventPieces.push(JSON.stringify(event));
          }
        });

        const eventsString = `"events":[\n${eventPieces.join(',\n')}\n]`;
        pieces.push(eventsString);
      }

      // 3. Фінальна склейка з чистими LF (\n)
      let finalContent = `{\n${pieces.join(',\n')}\n}`;

      // Жорстке очищення від можливих CRLF
      return finalContent.replace(/\r\n/g, '\n').replace(/\r/g, '');
    } catch (error) {
      console.error(`Не вдалося розпарсити файл ${fileName}. Перевірте чи це валідний JSON.`, error);
    }

    return '';
  }

  downloadBlob(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    // const newFileName = fileName.endsWith('.json')
    //   ? fileName.replace('.json', '_translated.json')
    //   : `${fileName}_translated.json`;

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  generateString(data: string[][]): string {
    return '';
  }

  private preperFile(updatedJson: any, isOld = false): string {
    if (isOld) {
      return JSON.stringify(updatedJson).replace(/\r\n/g, '\n').replace(/\r/g, '');
    }

    // ПОЧАТОК ГІБРИДНОЇ ЗБІРКИ JSON
    const pieces: string[] = [];

    // Збираємо базові метадані (все, крім великих масивів data та events) в один рядок
    const metaObj: any = {};
    for (const key in updatedJson) {
      if (updatedJson.hasOwnProperty(key) && key !== 'data' && key !== 'events') {
        metaObj[key] = updatedJson[key];
      }
    }

    // Перетворюємо мету в один рядок, але забираємо зовнішні фігурні дужки { }, 
    // бо ми самі сформуємо красиві переноси для корня.
    let metaString = JSON.stringify(metaObj);
    metaString = metaString.substring(1, metaString.length - 1); // зрізаємо першу { і останню }
    pieces.push(metaString);

    // 1. Обробка масиву "data" (тайли карти) — строго в один рядок
    if (updatedJson.hasOwnProperty('data')) {
      const dataString = `"data":${JSON.stringify(updatedJson.data)}`;
      pieces.push(dataString);
    }

    // 2. Обробка масиву "events" — кожен івент на новому рядку, але всередині івенту все мініфіковано
    if (updatedJson.hasOwnProperty('events') && Array.isArray(updatedJson.events)) {
      const eventPieces: string[] = [];

      updatedJson.events.forEach((event: any) => {
        if (event === null) {
          eventPieces.push('null'); // 👈 Прибрали пробіли
        } else {
          eventPieces.push(JSON.stringify(event)); // 👈 Прибрали пробіли
        }
      });

      // Збираємо секцію events з переносами рядків для кожного елемента
      const eventsString = `"events":[\n${eventPieces.join(',\n')}\n]`;
      pieces.push(eventsString);
    }

    // 3. Фінальна склейка всього файлу
    // Метадані та data йдуть через кому в один рядок, а перед events робимо перенос
    // Також примусово переводимо весь файл на LF (\n)
    let finalContent = `{\n${pieces.join(',\n')}\n}`;

    // Профілактичне очищення від залишків Windows-переносів \r, якщо вони десь пролізли з перекладів
    return finalContent.replace(/\r\n/g, '\n').replace(/\r/g, '');
  }

  exportSystemFile(csvContent: string[][], fileName: string, originalContent?: string): void {
    if (!originalContent) return;

    const updatedJson = JSON.parse(JSON.stringify(originalContent));

    csvContent.forEach((row, rowIndex) => {
      const jsonPath = row[0];
      const translatedText = row[2];

      // Перевіряємо валідність рядка таблиці
      if (!jsonPath || !translatedText) return;

      const normalizedPath = jsonPath
        .replace(/\[/g, '.')
        .replace(/\]/g, '')
        .replace(/^\./, '');

      const keys = normalizedPath.split('.');
      let current = updatedJson;

      try {
        for (let i = 0; i < keys.length - 1; i++) {
          let key: string | number = keys[i];
          if (!isNaN(Number(key))) key = Number(key);

          // 👈 ДОДАТКОВИЙ ЗАХИСТ: Перевіряємо, чи current взагалі є об'єктом, перш ніж брати ключ
          if (!current || typeof current !== 'object' || current[key] === undefined) {
            throw new Error(`Invalid path step: "${key}"`);
          }
          current = current[key];
        }

        let lastKey = keys[keys.length - 1];
        if (!isNaN(Number(lastKey))) lastKey = Number(lastKey) as unknown as string;

        // Перевіряємо фінальний вузол перед записом
        if (current && typeof current === 'object') {
          current[lastKey] = translatedText;
        }
      } catch (err) {
        // Логуємо проблемний рядок, але не зупиняємо експорт всього файлу
        console.warn(`[Export Warning] Пропущено бітий рядок таблиці #${rowIndex}. Шлях: "${jsonPath}".`, err);
      }
    });

    // 1. Генеруємо стандартний JSON рядок
    let finalContent = this.parceSystemFile(updatedJson);
    console.log(finalContent);

    this.downloadBlob(finalContent, fileName);
  }

  parceSystemFile(rawJsonText: any): string {
    console.log('debag', rawJsonText);
    try {
      let finalContent = '';

      // ======================================================================
      // ВАРІАНТ 1: Якщо файл є МАСИВОМ верхнього рівня (наприклад, [null, {"id":1}, ...])
      // ======================================================================
      if (Array.isArray(rawJsonText)) {
        const arrayPieces: string[] = [];

        rawJsonText.forEach((item: any) => {
          if (item === null) {
            arrayPieces.push('null');
          } else {
            // Мініфікуємо кожен окремий елемент (персонажа, предмет) в один рядок
            arrayPieces.push(JSON.stringify(item));
          }
        });

        // Збираємо масив докупи: відкриваюча і закриваюча дужки на нових рядках,
        // а елементи йдуть через кому з нового рядка без зайвих пробілів
        finalContent = `[\n${arrayPieces.join(',\n')}\n]`;

        // ======================================================================
        // ВАРІАНТ 2: Якщо файл є ОБ'ЄКТОМ (наприклад, карта карти з "data" та "events")
        // ======================================================================
      } else if (typeof rawJsonText === 'object' && rawJsonText !== null) {
        const pieces: string[] = [];

        // Збираємо базові метадані
        const metaObj: any = {};
        for (const key in rawJsonText) {
          if (rawJsonText.hasOwnProperty(key) && key !== 'data' && key !== 'events') {
            metaObj[key] = rawJsonText[key];
          }
        }

        let metaString = JSON.stringify(metaObj);
        metaString = metaString.substring(1, metaString.length - 1);
        if (metaString) {
          pieces.push(metaString);
        }

        // Масив "data"
        if (rawJsonText.hasOwnProperty('data')) {
          pieces.push(`"data":${JSON.stringify(rawJsonText.data)}`);
        }

        // Масив "events"
        if (rawJsonText.hasOwnProperty('events') && Array.isArray(rawJsonText.events)) {
          const eventPieces: string[] = [];
          rawJsonText.events.forEach((event: any) => {
            eventPieces.push(event === null ? 'null' : JSON.stringify(event));
          });
          pieces.push(`"events":[\n${eventPieces.join(',\n')}]`);
        }

        finalContent = `{\n${pieces.join(',\n')}\n}`;
      }

      // ======================================================================
      // ФІНАЛЬНЕ ОЧИЩЕННЯ ТА СКАЧУВАННЯ
      // ======================================================================
      // Заміна CRLF на LF та видалення битих \r

      console.log(`🎉 Файл успішно переформатовано за правильним шаблоном!`);
      return finalContent.replace(/\r\n/g, '\n').replace(/\r/g, '');

    } catch (error) {
      console.error(`Не вдалося розпарсити файл. Перевірте валідність JSON.`, error);
    }

    return '';
  }
}
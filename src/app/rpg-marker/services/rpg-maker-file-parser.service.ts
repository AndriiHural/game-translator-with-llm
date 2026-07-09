import { Injectable } from '@angular/core';

@Injectable()
export class RpgMakerFileParserService {
  public firstLine: string = 'JsonPath,OriginalText,TranslatedText';

  // Ключі, які ми хочемо перекладати у звичайних об'єктах
  // private textKeys = new Set(['description', 'name', '', 'message1', 'message2', 'message3', 'message4', '']);
  private textKeys = new Set(['displayName']);
  // private textKeys = new Set(['name']);
  // private textKeys = new Set(['description', 'name']);

  setTextKeys(keys: Set<string>) {
    this.textKeys = keys;
  }

  parseFile(rawContent: string): string[][] {
    const rawJsonData = JSON.parse(rawContent);
    const result: string[][] = [];

    // Запускаємо рекурсивний обхід з кореня JSON
    this.traverse(rawJsonData, '', result);

    return result;
  }

  private traverse(node: any, path: string, result: string[][]): void {
    if (node === null || node === undefined) return;

    // 1. Якщо це масив чи об'єкт, йдемо вглиб
    if (typeof node === 'object') {

      // Особлива перевірка для RPG Maker Events (команди діалогів)
      if (node.code !== undefined && node.parameters && Array.isArray(node.parameters)) {
        // code 401: рядок тексту діалогу. Текст лежить у parameters[0]
        // code 402: рядок вибору (Choice). Текст лежить у parameters[1]
        if (node.code === 401 && typeof node.parameters[0] === 'string' && node.parameters[0].trim()) {
          result.push([`${path}.parameters[0]`, node.parameters[0], '']);
          return;
        }
        if (node.code === 402 && typeof node.parameters[1] === 'string' && node.parameters[1].trim()) {
          result.push([`${path}.parameters[1]`, node.parameters[1], '']);
          return;
        }
      }

      // Рекурсивний обхід усіх полів об'єкта чи масиву
      for (const key in node) {
        if (node.hasOwnProperty(key)) {
          const nextPath = path ? `${path}.${key}` : key;

          // Якщо це звичайне текстове поле з нашого білого списку
          if (this.textKeys.has(key) && typeof node[key] === 'string' && node[key].trim()) {
            result.push([nextPath, node[key], '']);
          } else {
            // Інакше занурюємося далі
            this.traverse(node[key], nextPath, result);
          }
        }
      }
    }
  }
}
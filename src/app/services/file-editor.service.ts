import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileEditorService {
  private fileHandle: any = null;

  // 1. Відкриваємо файл і читаємо вміст
  async openFile(): Promise<string> {
    try {
      // Показуємо системне вікно вибору файлу
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'Локалізаційні файли',
          accept: { 'application/json': ['.json'], 'text/csv': ['.csv'] }
        }]
      });

      this.fileHandle = handle;
      const file = await this.fileHandle.getFile();
      const content = await file.text();
      return content;
    } catch (error) {
      console.error('Помилка відкриття файлу:', error);
      throw error;
    }
  }

  // 2. Зберігаємо зміни прямо в той самий файл
  async saveFile(newContent: string): Promise<void> {
    if (!this.fileHandle) {
      throw new Error('Файл не відкритий або дескриптор втрачено');
    }

    try {
      // Запитуємо дозвіл на запис (якщо браузер вимагає повторно)
      const options = { mode: 'readwrite' };
      if ((await this.fileHandle.queryPermission(options)) !== 'granted') {
        if ((await this.fileHandle.requestPermission(options)) !== 'granted') {
          throw new Error('Доступ до запису відхилено користувачем');
        }
      }

      // Створюємо потік для запису
      const writable = await this.fileHandle.createWritable();
      await writable.write(newContent);
      await writable.close();
      console.log('Файл успішно перезаписано!');
    } catch (error) {
      console.error('Помилка збереження файлу:', error);
      throw error;
    }
  }
}
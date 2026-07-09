// import { Component, computed, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FileParserService } from '../services/file-parser.service';
// import { ChunkService } from '../services/chunk.service';
// import { TranslateResult, TranslatorService } from '../services/translate.service';
// import { TranslateTable } from '../components/translate-table/translate-table';
// import { FormsModule } from '@angular/forms';
// import { FILE_EXPORT_TOKEN, FILE_PARSER_TOKEN } from '../tokens/file-processor.tokens';

// interface UploadedFile {
// 	name: string;
// 	content: string;
// 	parsedData?: string[][]; // Зберігаємо результат парсингу тут, щоб не парсити щоразу
// }

// @Component({
// 	selector: 'app-file-upload',
// 	standalone: true,
// 	imports: [CommonModule, TranslateTable, FormsModule],
// 	providers: [TranslatorService],
// 	templateUrl: './file-upload.html',
// 	styleUrls: ['./file-upload.scss']
// })
// export class FileUploadComponent {
// 	private fileParserService = inject(FILE_PARSER_TOKEN);

// 	private chunkService = inject(ChunkService);
// 	private translatorService = inject(TranslatorService);
// 	private fileExportService = inject(FILE_EXPORT_TOKEN);

// 	fileName: string = '';
// 	error: string | null = null;
// 	headerCells = signal<string[]>([]);
// 	csvContent = signal<string[][]>([]); // Двовимірний масив [рядки][колонки]
// 	originalCsvContent = signal<string[][]>([]);
// 	chunks = signal<string[][][]>([])
// 	chunkSize = signal(3000);

// 	targetColumn: number = 2;
// 	sourceColumn: number = 1;
// 	currentChunkNumber = 0;
// 	olamaResponse = signal<TranslateResult | null>(null);

// 	isAutoTranslating = false;

// 	// Список усіх завантажених файлів
// 	public filesList = signal<UploadedFile[]>([]);

// 	// Індекс поточного вибраного файлу в селекті
// 	public selectedFileIndex = signal<number | null>(null);

// 	// Обчислювальний сигнал для зручного доступу до поточного файлу
// 	public currentFile = computed(() => {
// 		const index = this.selectedFileIndex();
// 		return index !== null ? this.filesList()[index] : null;
// 	});

// 	onFileChange(event: any) {
// 		const file = event.target.files[0];
// 		if (!file) return;

// 		this.fileName = file.name;
// 		this.error = null;

// 		const reader = new FileReader();
// 		reader.onload = (e: any) => {
// 			const content = e.target.result as string;
// 			this.processFile(content);
// 		};
// 		reader.readAsText(file);
// 	}

// 	private processFile(rawContent: string) {
// 		try {
// 			// Передаємо текст файлу
// 			const result = this.fileParserService.parseFile(rawContent);
// 			console.log('Успішно розпарсено! Результат:', result);

// 			this.headerCells.set(this.fileParserService.firstLine.split(','));
// 			this.csvContent.set(result);
// 			this.originalCsvContent.set(JSON.parse(JSON.stringify(result)));
// 			this.chunks.set(this.splitIntoChunks(result, this.chunkSize()));
// 		} catch (error: any) {
// 			// Сюди прилетить красивий Error, наприклад: "Помилка у рядку №3: Очікувалось колонок: 7, але знайдено більше."
// 			this.error = error instanceof Error ? error.message : 'Помилка парсингу';
// 			alert(error.message);
// 		}
// 	}


// 	updateCell(rowIndex: number, colIndex: number, newValue: string) {
// 		const current = this.csvContent();

// 		if (current[rowIndex]) {
// 			current[rowIndex][colIndex] = newValue;
// 			this.csvContent.set(current);
// 		}
// 	}

// 	// Експорт результату назад у формат Unity TextAsset
// 	exportFile() {
// 		this.fileExportService.exportFile(this.csvContent(), this.fileName);
// 	}

// 	clearData() {
// 		this.csvContent.set([]);
// 		this.fileName = '';
// 		this.error = null;
// 	}

// 	async testOlama() {

// 		let result: string[][] = [];

// 		for (const chunk of this.chunks()) {
// 			const response = await this.translatorService.translateChunk(
// 				chunk,
// 				this.sourceColumn,
// 				this.targetColumn
// 			);
// 			const items = response.items;
// 			const mapedResponse = response.map;
// 			const result = this.translatorService.applyTranslations(
// 				chunk,
// 				this.targetColumn,
// 				items,
// 				mapedResponse
// 			);

// 			const validated = await this.translatorService.validate(
// 				chunk,
// 				result,
// 				this.sourceColumn,
// 				this.targetColumn
// 			);

// 			result.concat(validated);
// 		}

// 		console.log(result);
// 		this.csvContent.set(result);
// 	}

// 	async nextChunk() {
// 		this.currentChunkNumber++;
// 		if (this.currentChunkNumber >= this.chunks().length) {
// 			return;
// 		}
// 	}

// 	async applyResponse() {
// 		const chunk = this.chunks()[this.currentChunkNumber];
// 		const result = this.translatorService.applyTranslations(
// 			chunk,
// 			this.targetColumn,
// 			this.olamaResponse()!.items,
// 			this.olamaResponse()!.map
// 		);

// 		const validated = await this.translatorService.validate(
// 			chunk,
// 			result,
// 			this.sourceColumn,
// 			this.targetColumn
// 		);

// 		console.log('before update', [...this.csvContent()]);
// 		this.csvContent.update(current => {
// 			const validatedMap = new Map(validated.map(row => [row[0], row]));
// 			return current.map(row => validatedMap.get(row[0]) ?? row);
// 		});

// 		console.log('updated', [...this.csvContent()]);
// 	}

// 	async retryTranslate(rowIndex: number) {
// 		const rowData = this.csvContent()[rowIndex];
// 		const translatedRow = await this.translatorService.translateLine(
// 			[rowData],
// 			this.sourceColumn,
// 			this.targetColumn
// 		);

// 		this.csvContent.update(current => {
// 			current[rowIndex] = translatedRow[0];
// 			return [...current];
// 		});
// 	}

// 	onResetClick() {
// 		this.csvContent.set(this.originalCsvContent());
// 	}

// 	updateResponse(event: Event) {
// 		const textarea = event.target as HTMLTextAreaElement; // Безпечно приводимо тип
// 		console.log('textarea.value', textarea.value)
// 		this.olamaResponse.update(data => {
// 			if (!data) return data; // Захист від null/undefined
// 			return {
// 				...data,
// 				rowResponse: textarea.value
// 			};
// 		});
// 	}

// 	async startAutoTranslation() {
// 		this.isAutoTranslating = true;
// 		await this.translateCurrentChunk();
// 	}

// 	stopAutoTranslation() {
// 		this.isAutoTranslating = false;
// 	}

// 	async translateCurrentChunk() {
// 		// 1. Перевірка, чи не вийшли ми за межі масиву чанків
// 		if (this.currentChunkNumber >= this.chunks().length) {
// 			console.log('All chunks translated successfully!');
// 			this.isAutoTranslating = false;
// 			return;
// 		}

// 		try {
// 			const response = await this.translatorService.translateChunk(
// 				this.chunks()[this.currentChunkNumber],
// 				this.sourceColumn,
// 				this.targetColumn
// 			);

// 			this.olamaResponse.set(response);
// 			console.log('Response success:', response);

// 			// 👉 Крок 1: Успіх! Застосовуємо відповідь (якщо потрібно автоматично)
// 			// Також переходимо до наступного чанку
// 			this.applyResponse(); // Якщо у тебе метод applyResponse() синхронний або асинхронний
// 			this.nextChunk();     // Збільшує currentChunkNumber на 1

// 			// 👉 Крок 2: Якщо увімкнено авто-режим, запускаємо наступний чанк
// 			if (this.isAutoTranslating) {
// 				// Невеликий таймаут, щоб дати браузеру "подихати" та оновити UI
// 				setTimeout(() => this.translateCurrentChunk(), 300);
// 			}

// 		} catch (error) {
// 			console.error('Translation failed, adjusting chunk size...', error);

// 			// 👉 Крок 3: Помилка. Зменшуємо розмір чанку (мінімум 100, крок 50)
// 			// Якщо chunkSize — це звичайне число:
// 			const currentSize = this.chunkSize; // або this.chunkSize() якщо це сигнал

// 			// Розраховуємо новий розмір, але не менше 100
// 			const newSize = Math.max(100, currentSize() - 50);

// 			if (newSize === currentSize()) {
// 				// Якщо розмір вже 100 і менше не стає, зупиняємося, щоб не було нескінченного циклу помилок
// 				console.warn('Chunk size is already at minimum (100). Stopping auto-translation.');
// 				this.error = 'Failed even with the smallest chunk size.';
// 				this.isAutoTranslating = false;
// 				return;
// 			}

// 			// Оновлюємо chunkSize (приклад для звичайної змінної або сигналу)
// 			// Якщо це сигнал: this.chunkSize.set(newSize);
// 			this.chunkSize.set(newSize);

// 			// Перегенерувати чанки! Оскільки розмір змінився, твій метод перерозподілу 
// 			// має створити нові (менші) чанки на основі поточної позиції.
// 			this.chunks.set(this.splitIntoChunks(this.csvContent(), newSize));

// 			// 👉 Крок 4: Пробуємо ще раз той самий індекс чанку, але вже з новим розміром
// 			if (this.isAutoTranslating) {
// 				setTimeout(() => this.translateCurrentChunk(), 500);
// 			}
// 		}
// 	}

// 	private splitIntoChunks(csvContent: string[][], chunkSize: number) {
// 		return this.chunkService.splitByCharacters(csvContent, this.sourceColumn, chunkSize);
// 	}

// 	copyToClipboard() {
// 		const text = this.fileExportService.generateString(this.csvContent());
// 		navigator.clipboard.writeText(text);
// 	}
// }
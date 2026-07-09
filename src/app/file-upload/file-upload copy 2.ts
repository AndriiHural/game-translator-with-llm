// import { Component, computed, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChunkService } from '../services/chunk.service';
// import { TranslateResult, TranslatorService } from '../services/translate.service';
// import { TranslateTable } from '../components/translate-table/translate-table';
// import { FormsModule } from '@angular/forms';
// import { FILE_EXPORT_TOKEN, FILE_PARSER_TOKEN } from '../tokens/file-processor.tokens';
// import { async } from 'rxjs';

// interface UploadedFile {
// 	name: string;
// 	content: string;
// 	parsedData: string[][];         // Поточні робочі дані (з перекладом)
// 	originalParsedData: string[][]; // Копія для скидання (Reset)
// 	chunks: string[][][];           // Нарізані чанки саме для цього файлу
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

// 	error: string | null = null;
// 	headerCells = signal<string[]>([]);
// 	chunkSize = signal(3000);

// 	targetColumn: number = 2;
// 	sourceColumn: number = 1;
// 	currentChunkNumber = 0;
// 	olamaResponse = signal<TranslateResult | null>(null);
// 	isAutoTranslating = false;

// 	// Мультифайловість
// 	public filesList = signal<UploadedFile[]>([]);
// 	public selectedFileIndex = signal<number | null>(null);

// 	// Працюємо з поточним файлом декларативно
// 	public currentFile = computed(() => {
// 		const index = this.selectedFileIndex();
// 		return index !== null ? this.filesList()[index] : null;
// 	});

// 	// Замість окремого сигналу робимо computed-геттер для таблиці UI
// 	public csvContent = computed(() => this.currentFile()?.parsedData ?? []);
// 	public chunks = computed(() => this.currentFile()?.chunks ?? []);

// 	// Обробка вибору/додавання нових файлів
// 	onFileChange(event: any) {
// 		const files: FileList = event.target.files;
// 		if (!files.length) return;

// 		const loaders = Array.from(files).map(file => this.readFileAsync(file));

// 		Promise.all(loaders).then(newFiles => {
// 			// Створюємо абсолютно новий масив (immutability), щоб сигнал здетонував
// 			this.filesList.update(current => [...current, ...newFiles]);

// 			// Автовибір файлу
// 			if (this.selectedFileIndex() === null) {
// 				this.selectFile(this.filesList().length - newFiles.length);
// 			}
// 		}).catch(err => {
// 			this.error = err instanceof Error ? err.message : 'Помилка завантаження файлу';
// 			alert(this.error);
// 		});
// 	}

// 	private readFileAsync(file: File): Promise<UploadedFile> {
// 		return new Promise((resolve, reject) => {
// 			const reader = new FileReader();
// 			reader.onload = (e: any) => {
// 				try {
// 					const content = e.target.result as string;
// 					const result = this.fileParserService.parseFile(content);
// 					const initialChunks = this.splitIntoChunks(result, this.chunkSize());

// 					resolve({
// 						name: file.name,
// 						content: content,
// 						parsedData: result,
// 						originalParsedData: JSON.parse(JSON.stringify(result)),
// 						chunks: initialChunks
// 					});
// 				} catch (err) {
// 					reject(err);
// 				}
// 			};
// 			reader.readAsText(file);
// 		});
// 	}

// 	// Перемикання файлу через селект
// 	selectFile(index: number) {
// 		this.selectedFileIndex.set(index);
// 		this.currentChunkNumber = 0;
// 		this.olamaResponse.set(null);
// 		this.error = null;

// 		// Хедери витягуємо з сервісу парсингу
// 		if (this.fileParserService.firstLine) {
// 			this.headerCells.set(this.fileParserService.firstLine.split(','));
// 		}
// 	}

// 	// Допоміжний метод для мутації стану поточного файлу
// 	private updateCurrentFileData(updater: (file: UploadedFile) => void) {
// 		const index = this.selectedFileIndex();
// 		if (index === null) return;

// 		this.filesList.update(list => {
// 			// 1. Робимо поверхневу копію масиву
// 			const updatedList = [...list];

// 			// 2. Глибоко копіюємо саме той файл, який змінюємо
// 			const fileToUpdate = { ...updatedList[index] };

// 			// 3. Модифікуємо його копію
// 			updater(fileToUpdate);

// 			// 4. Записуємо оновлений об'єкт назад у масив
// 			updatedList[index] = fileToUpdate;

// 			return updatedList;
// 		});
// 	}

// 	exportFile() {
// 		const file = this.currentFile();
// 		if (!file) return;
// 		this.fileExportService.exportFile(file.parsedData, file.name);
// 	}

// 	clearData() {
// 		this.filesList.set([]);
// 		this.selectedFileIndex.set(null);
// 		this.currentChunkNumber = 0;
// 		this.error = null;
// 	}

// 	onResetClick() {
// 		this.updateCurrentFileData(file => {
// 			file.parsedData = JSON.parse(JSON.stringify(file.originalParsedData));
// 			file.chunks = this.splitIntoChunks(file.parsedData, this.chunkSize());
// 		});
// 		this.currentChunkNumber = 0;
// 	}

// 	async applyResponse() {
// 		const chunk = this.chunks()[this.currentChunkNumber];
// 		if (!chunk || !this.olamaResponse()) return;

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

// 		// Оновлюємо дані всередині активного файлу
// 		this.updateCurrentFileData(file => {
// 			const validatedMap = new Map(validated.map(row => [row[0], row]));
// 			file.parsedData = file.parsedData.map(row => validatedMap.get(row[0]) ?? row);
// 		});
// 	}

// 	async retryTranslate(rowIndex: number) {
// 		const rowData = this.csvContent()[rowIndex];
// 		if (!rowData) return;

// 		const translatedRow = await this.translatorService.translateLine(
// 			[rowData],
// 			this.sourceColumn,
// 			this.targetColumn
// 		);

// 		this.updateCurrentFileData(file => {
// 			file.parsedData[rowIndex] = translatedRow[0];
// 		});
// 	}

// 	async translateCurrentChunk() {
// 		if (this.currentChunkNumber >= this.chunks().length) {
// 			console.log('All chunks translated for this file!');
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
// 			await this.applyResponse();
// 			this.nextChunk();

// 			if (this.isAutoTranslating) {
// 				setTimeout(() => this.translateCurrentChunk(), 300);
// 			}
// 		} catch (error) {
// 			console.error('Translation failed, adjusting chunk size...', error);
// 			const currentSize = this.chunkSize();
// 			const newSize = Math.max(100, currentSize - 50);

// 			if (newSize === currentSize) {
// 				this.error = 'Failed even with the smallest chunk size.';
// 				this.isAutoTranslating = false;
// 				return;
// 			}

// 			this.chunkSize.set(newSize);

// 			// Перераховуємо чанки саме для поточного стану файлу
// 			this.updateCurrentFileData(file => {
// 				file.chunks = this.splitIntoChunks(file.parsedData, newSize);
// 			});

// 			if (this.isAutoTranslating) {
// 				setTimeout(() => this.translateCurrentChunk(), 500);
// 			}
// 		}
// 	}

// 	async translateAndDownloadAllFiles() {
// 		const allFiles = this.filesList();
// 		if (allFiles.length === 0) return;

// 		this.isAutoTranslating = true;
// 		this.error = null;

// 		try {
// 			for (let i = 0; i < allFiles.length; i++) {
// 				if (!this.isAutoTranslating) break;

// 				// 1. Перемикаємо на потрібний файл
// 				this.selectFile(i);
// 				console.log(`--- Старт пакетного перекладу файлу [${i + 1}/${allFiles.length}]: ${allFiles[i].name} ---`);

// 				// Чекаємо, щоб Angular оновив computed-сигнали (chunks) для нового файлу
// 				await new Promise(resolve => setTimeout(resolve, 150));

// 				// 2. ВНУТРІШНІЙ ЦИКЛ: Крутимо, поки для ПОТОЧНОГО файлу є неперекладені чанки
// 				while (this.currentChunkNumber < this.chunks().length) {
// 					if (!this.isAutoTranslating) break;

// 					try {
// 						console.log(`Файл "${allFiles[i].name}": чанк ${this.currentChunkNumber + 1}/${this.chunks().length}`);

// 						// Викликаємо сервіс перекладу НАПРЯМУ тут (без рекурсії через setTimeout)
// 						const response = await this.translatorService.translateChunk(
// 							this.chunks()[this.currentChunkNumber],
// 							this.sourceColumn,
// 							this.targetColumn
// 						);

// 						this.olamaResponse.set(response);
// 						await this.applyResponse();
// 						this.nextChunk(); // Збільшуємо індекс чанку
// 						this.chunkSize.update(size => size + 100);
// 						// Пауза між чанками всередині одного файлу
// 						await new Promise(resolve => setTimeout(resolve, 300));

// 					} catch (error) {
// 						console.error('Translation failed, adjusting chunk size...', error);
// 						const currentSize = this.chunkSize();
// 						const newSize = Math.max(100, currentSize - 250);

// 						if (newSize === currentSize) {
// 							this.error = 'Failed even with the smallest chunk size.';
// 							this.isAutoTranslating = false;
// 							// break; // Виходимо з циклу чанків цього файлу
// 						}

// 						this.chunkSize.set(newSize);

// 						// Перераховуємо чанки для поточного файлу
// 						this.updateCurrentFileData(file => {
// 							file.chunks = this.splitIntoChunks(file.parsedData, newSize);
// 						});

// 						// Пауза перед повторною спробою того самого чанку (бо індекс не збільшився)
// 						await new Promise(resolve => setTimeout(resolve, 500));
// 					}
// 				}

// 				// 3. Скачуємо файл ТІЛЬКИ тоді, коли вищеописаний цикл while ПОВНІСТЮ завершився
// 				if (this.isAutoTranslating && this.error === null) {
// 					console.log(`Файл ${allFiles[i].name} повністю оброблено. Завантажуємо...`);
// 					this.exportFile();
// 				}

// 				// Чистимо стан перед наступним файлом
// 				this.currentChunkNumber = 0;
// 				this.olamaResponse.set(null);
// 				this.chunkSize.update(size => size > 500 ? size : 1000);
// 				await new Promise(resolve => setTimeout(resolve, 500));
// 			}

// 			console.log('🎉 Усі файли успішно оброблено!');

// 		} catch (error) {
// 			console.error('Помилка під час пакетного перекладу:', error);
// 			this.error = 'Пакетний переклад перервано через помилку.';
// 		} finally {
// 			this.isAutoTranslating = false;
// 		}
// 	}

// 	async nextChunk() {
// 		this.currentChunkNumber++;
// 	}

// 	async startAutoTranslation() {
// 		this.isAutoTranslating = true;
// 		await this.translateCurrentChunk();
// 		this.isAutoTranslating = false;
// 	}

// 	stopAutoTranslation() {
// 		this.isAutoTranslating = false;
// 	}

// 	updateResponse(event: Event) {
// 		const textarea = event.target as HTMLTextAreaElement;
// 		this.olamaResponse.update(data => {
// 			if (!data) return data;
// 			return { ...data, rowResponse: textarea.value };
// 		});
// 	}

// 	private splitIntoChunks(csvContent: string[][], chunkSize: number) {
// 		return this.chunkService.splitByCharacters(csvContent, this.sourceColumn, chunkSize);
// 	}

// 	copyToClipboard() {
// 		this.fileExportService.exportFile(this.csvContent(), this.currentFile()?.name || 'export.txt');
// 	}

// 	updateFullTable(newTable: string[][]) {
// 		this.updateCurrentFileData(file => {
// 			file.parsedData = newTable;
// 		});
// 	}
// }
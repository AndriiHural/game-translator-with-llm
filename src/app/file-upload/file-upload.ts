import { Component, computed, EnvironmentInjector, inject, runInInjectionContext, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChunkService } from '../services/chunk.service';
import { TranslateResult, TranslatorService } from '../services/translate.service';
import { TranslateTable } from '../components/translate-table/translate-table';
import { FormsModule } from '@angular/forms';
import { FILE_EXPORT_TOKEN, FILE_PARSER_TOKEN } from '../tokens/file-processor.tokens';
import { TranslatedRow } from '../types/translated-row.model';
import { Chunk } from '../classes/chunk.model';
import { Injector } from '@angular/core';

interface UploadedFile {
	name: string;
	content: string;
	parsedData: string[][];         // Поточні робочі дані (з перекладом)
	originalParsedData: string[][]; // Копія для скидання (Reset)
	chunks: string[][][];           // Нарізані чанки саме для цього файлу
	originalContent: string;           // Оригінальний контент
}

@Component({
	selector: 'app-file-upload',
	standalone: true,
	imports: [CommonModule, TranslateTable, FormsModule],
	providers: [TranslatorService],
	templateUrl: './file-upload.html',
	styleUrls: ['./file-upload.scss']
})
export class FileUploadComponent {
	protected fileParserService = inject(FILE_PARSER_TOKEN);
	private chunkService = inject(ChunkService);
	private translatorService = inject(TranslatorService);
	protected fileExportService = inject(FILE_EXPORT_TOKEN);
	protected injector = inject(Injector);

	error: string | null = null;
	headerCells = signal<string[]>([]);
	chunkSize = signal(3000);

	targetColumn: number = 2;
	sourceColumn: number = 1;
	currentChunkNumber = 0;
	olamaResponse = signal<TranslateResult | null>(null);
	isAutoTranslating = false;

	// Мультифайловість
	public filesList = signal<UploadedFile[]>([]);
	public selectedFileIndex = signal<number | null>(null);

	constructor() {
		const t = {
			"0": null, "1": { "id": 1, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Відновлює 30% Здоров'я.", "effects": [{ "code": 11, "dataId": 0, "value1": 0.3, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Зілля лікування", "note": "", "occasion": 0, "price": 10, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "2": { "id": 2, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Відновлює 30% Мани.", "effects": [{ "code": 12, "dataId": 0, "value1": 0.3, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Магічна вода", "note": "", "occasion": 0, "price": 100, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "3": { "id": 3, "animationId": 45, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Знімає всі дебафи.", "effects": [{ "code": 22, "dataId": 4, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 5, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 6, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 7, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 8, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 9, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 10, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 0, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 1, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 2, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 3, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 4, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 5, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 6, "value1": 1, "value2": 0 }, { "code": 34, "dataId": 7, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 12, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 11, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Зілля повного зцілення", "note": "", "occasion": 0, "price": 50, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "4": { "id": 4, "animationId": 49, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "b.mhp*0.3", "type": 3, "variance": 20 }, "description": "Відродити персонажа з 30% ЗД.", "effects": [{ "code": 44, "dataId": 105, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 1, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 181, "itypeId": 1, "name": "Трав'я віскресіння", "note": "", "occasion": 0, "price": 100, "repeats": 1, "scope": 9, "speed": 0, "successRate": 100, "tpGain": 0 }, "5": { "id": 5, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "b.mhp*0.3", "type": 0, "variance": 20 }, "description": "Відновлює 10% Здоров'я.", "effects": [{ "code": 11, "dataId": 0, "value1": 0.1, "value2": 0 }], "hitType": 0, "iconIndex": 181, "itypeId": 1, "name": "Лікувальна трава", "note": "", "occasion": 0, "price": 5, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "6": { "id": 6, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Запрошення з гільдії. Покажіть його солдатам у замку, щоб взяти участь у протистоянні армії демонів.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 2, "name": "Рекомендаційний лист", "note": "", "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "7": { "id": 7, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Шматочки слизу.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Шматочок слизу", "note": "", "occasion": 3, "price": 10, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "8": { "id": 8, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Тканина, просочена запахом суккубів.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Шматок тканини", "note": "", "occasion": 3, "price": 25, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "9": { "id": 9, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Тентаклі Дріади, які все ще продовжують рухатися.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Тентаклі Дріади", "note": "", "occasion": 3, "price": 55, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "10": { "id": 10, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Волос звіра.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Волос тварини", "note": "", "occasion": 3, "price": 15, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "11": { "id": 11, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Гриб, який дає вам енергію. (Отримати 30 ТП)", "effects": [{ "code": 13, "dataId": 0, "value1": 30, "value2": 0 }], "hitType": 0, "iconIndex": 261, "itypeId": 1, "name": "Гриб", "note": "", "occasion": 1, "price": 2, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "12": { "id": 12, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Рідкісний гриб, який значно збільшує енергію. (Отримати 100 ТП) (Збільшує шанс перетворити ворога)", "effects": [{ "code": 13, "dataId": 0, "value1": 100, "value2": 0 }, { "code": 44, "dataId": 107, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 261, "itypeId": 1, "name": "Гриб високої якості", "note": "", "occasion": 1, "price": 20, "repeats": 1, "scope": 8, "speed": 0, "successRate": 100, "tpGain": 0 }, "13": { "id": 13, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Відновлює 60% Здоров'я.", "effects": [{ "code": 11, "dataId": 0, "value1": 0.6, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Посилене зілля лікування", "note": "", "occasion": 0, "price": 100, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "14": { "id": 14, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Відновлює 100% Здоров'я.", "effects": [{ "code": 11, "dataId": 0, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Супер зілля лікування", "note": "", "occasion": 0, "price": 200, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "15": { "id": 15, "animationId": 45, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Зменшує розбещення та мазохізм.", "effects": [], "hitType": 0, "iconIndex": 181, "itypeId": 1, "name": "Дивовижна трава", "note": "", "occasion": 1, "price": 10, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "16": { "id": 16, "animationId": 45, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Знімає мовчання", "effects": [{ "code": 22, "dataId": 6, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 181, "itypeId": 1, "name": "Трава розвіювання", "note": "", "occasion": 1, "price": 10, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "17": { "id": 17, "animationId": 45, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Лікує від отрути.", "effects": [{ "code": 22, "dataId": 4, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 181, "itypeId": 1, "name": "Трава протиотрути", "note": "", "occasion": 0, "price": 10, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "18": { "id": 18, "animationId": 45, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Трава, яка заспокоює тіло та знижує збудження.", "effects": [{ "code": 22, "dataId": 11, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Заспокійливе", "note": "", "occasion": 1, "price": 15, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "19": { "id": 19, "animationId": 122, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Солодке та смачне молоко. (Відновлює 80% ЗД)", "effects": [{ "code": 11, "dataId": 0, "value1": 0.8, "value2": 0 }, { "code": 44, "dataId": 43, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 275, "itypeId": 1, "name": "Коров'яче молочко", "note": "", "occasion": 0, "price": 5, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "20": { "id": 20, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Шкірка, що виглядає як мерехтливі перли.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Шкіра Ламії", "note": "", "occasion": 3, "price": 200, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "21": { "id": 21, "animationId": 125, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Мастурбатор, зроблений зі залишків слизу. (Дає 50 ТП)", "effects": [{ "code": 13, "dataId": 0, "value1": 50, "value2": 0 }], "hitType": 0, "iconIndex": 84, "itypeId": 1, "name": "Слизновий мастурбатор", "note": "<mat1:I7*4>\n<matG:25>", "occasion": 1, "price": 50, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "22": { "id": 22, "animationId": 125, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Мастурбатор із щупальцями, що вигинаються всередині. (Дає 100 ТП)", "effects": [{ "code": 13, "dataId": 0, "value1": 100, "value2": 0 }], "hitType": 0, "iconIndex": 84, "itypeId": 1, "name": "Тентакльовий мастурбатор", "note": "<mat1:I46*1>\n<matG:10>", "occasion": 1, "price": 40, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "23": { "id": 23, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Проникнення", "note": "<SG説明:\\c[27]Сексуальные\\c[0] навыки нельзя использовать после\nпроникновения. Кроме того, если вы использовали \n\\c[27]Проникнуть\\c[0], то тоже не сможете их использовать.\nСтраница(1/3)>\n<SG説明3:\\i[14] Урон от навыков проникновения в киску\nзависит от вашего \\c[27]Очарования\\c[0].\n\\i[15] Урон от навыков проникновения в анус\nзависит от \\c[27]Очарования\\c[0] противника.\nТакже проникновение длится 4 хода.\nСтраница(3/3)>\n<SG説明2:Если чья-то \\c[27]Киска\\c[0] или \\c[27]Анус\\c[0] уже \nзаняты, то на них нельзя использовать секс атаки,\nнацеленные на дырку. Однако есть некоторые \nспособности которые игнорируют это правило.\nСтрацина(2/3)>\n<SGピクチャ:ヒント2>\n<SGピクチャ位置:top>\n<SGカテゴリ:Геймплей>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "24": { "id": 24, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Швидкість бою", "note": "<SG説明:Скорость боя увеличится, если нажать кнопку\nпропустить в правом верхнем углу окна сообщения. \nЭто так же можно сделать нажав \\c[27]Shift\\c[0] или\nпутём удерживания кнопки \\c[27]Z\\c[0].>\n\n<SGピクチャ:ヒント>\n<SGピクチャ位置:top>\n<SGカテゴリ:Геймплей> ", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "25": { "id": 25, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Рекрутування", "note": "<SG説明:\\c[27]Сперма Элины\\c[0] может рекрутить ваших врагов.\nВы можете бесконечно пытаться рекрутить \nвстреченных вами врагов в подмирье.\nСтраница(1/3)>\n<SG説明2:\nВаши союзники не могут рекрутить противников, но вы \nможете использовать их, чтобы ослабить врагов,\nиспользуя состояния \\c[27]Похоть\\c[0] или \\c[27]Мазохизм\\c[0].\nСтраница(2/3)>\n<SG説明3:Чем выше ваш TP, тем больше урона \nнаносит ваша эякуляция.\nСтраница(3/3)>\n<SGピクチャ:ヒント3>\n<SGピクチャ2:ヒント3_2>\n<SGピクチャ位置:top>\n<SGカテゴリ:Геймплей> \n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "26": { "id": 26, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Складність рівня", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Складність", "note": "<SG説明:Вы можете установить сложность в настройках \nи можете изменять его в любое время.>\n<SGピクチャ:ヒント4>\n<SGピクチャ位置:top>\n<SGカテゴリ:Геймплей> \n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "27": { "id": 27, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "H-сцени", "note": "<SG説明:Во время H-Сцены вы можете включить авто текст \nнажав \\c[27]A\\c[0] или \\c[27]S\\c[0] для быстрой промотки.\nОкно текста можно скрыть нажав \\c[27]ПКМ\\c[0].>\n<SG説明2: Это можно использовать в обычных разговорах>\n<SGピクチャ:ヒント5>\n<SGピクチャ位置:top>\n<SGカテゴリ:Геймплей>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "28": { "id": 28, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Валюта", "note": "", "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "29": { "id": 29, "animationId": 41, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Багатий та смачний сир. (Відновлює 60% Мани)", "effects": [{ "code": 12, "dataId": 0, "value1": 0.6, "value2": 0 }, { "code": 44, "dataId": 43, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 269, "itypeId": 1, "name": "Смачний сир", "note": "", "occasion": 0, "price": 15, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "30": { "id": 30, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Ключ до чогось.", "effects": [], "hitType": 0, "iconIndex": 195, "itypeId": 2, "name": "Ключ 1", "note": "", "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "31": { "id": 31, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Ключ до чогось.", "effects": [], "hitType": 0, "iconIndex": 195, "itypeId": 2, "name": "Ключ 2", "note": "", "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "32": { "id": 32, "animationId": 155, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Лосьйон, який збуджує користувача. 100% Збудження.", "effects": [{ "code": 21, "dataId": 11, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Еротичний лосьйон", "note": "<mat1:I7*5>\n<matG:50>", "occasion": 1, "price": 100, "repeats": 1, "scope": 1, "speed": 0, "successRate": 100, "tpGain": 0 }, "33": { "id": 33, "animationId": 163, "consumable": false, "damage": { "critical": false, "elementId": 12, "formula": "20", "type": 1, "variance": 0 }, "description": "Ділдо, яке вібрує магічною силою. (20 шкоди)", "effects": [{ "code": 44, "dataId": 115, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 14, "itypeId": 1, "name": "Магічний вібратор", "note": "<mat1:I34*2>\n<matG:250>", "occasion": 1, "price": 500, "repeats": 1, "scope": 1, "speed": 0, "successRate": 100, "tpGain": 0 }, "34": { "id": 34, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Фрагмент кристалізованої магічної енергії. Можна продати за гарною ціною.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Магічний фрагмент", "note": "", "occasion": 3, "price": 250, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "35": { "id": 35, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Дозволяє участь у сповіді.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 2, "name": "Книжка благодаті", "note": "", "occasion": 3, "price": 0, "repeats": 1, "scope": 0, "speed": 0, "successRate": 100, "tpGain": 0 }, "36": { "id": 36, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Ікла монстра. З них я можу зробити аmuлет.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Ікла Диявола", "note": "", "occasion": 3, "price": 350, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "37": { "id": 37, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Кіготь дракона. У ньому запечатана сильна енергія.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Кіготь Дракона", "note": "", "occasion": 3, "price": 500, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "38": { "id": 38, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Блискавка.", "effects": [{ "code": 43, "dataId": 10, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга чарівника грому", "note": "", "occasion": 2, "price": 1000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "39": { "id": 39, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, яка дозволяє використовувати Змінити групу. (Тільки Еліна)", "effects": [{ "code": 44, "dataId": 116, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Таємнича Книга Чарівника", "note": "", "occasion": 2, "price": 0, "repeats": 1, "scope": 8, "speed": 0, "successRate": 100, "tpGain": 0 }, "40": { "id": 40, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Полум'я.", "effects": [{ "code": 43, "dataId": 9, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга чарівника вогню", "note": "", "occasion": 2, "price": 1000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "41": { "id": 41, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Лід.", "effects": [{ "code": 43, "dataId": 146, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга чарівника льоду", "note": "", "occasion": 2, "price": 1000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "42": { "id": 42, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Спалах.", "effects": [{ "code": 43, "dataId": 147, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга чарівника води", "note": "", "occasion": 2, "price": 1000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "43": { "id": 43, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Зцілення.", "effects": [{ "code": 43, "dataId": 8, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга цілителя", "note": "", "occasion": 2, "price": 4000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "44": { "id": 44, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Прекрасне волосся звіра. Воно таке привабливе.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Сексуальне волосся", "note": "", "occasion": 3, "price": 300, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "45": { "id": 45, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Часткове зцілення.", "effects": [{ "code": 43, "dataId": 108, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга досвідченого цілителя", "note": "", "occasion": 2, "price": 8000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "46": { "id": 46, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Тентаклі, які продовжують рухатися після від'єднання. Комусь це може бути цікаво.", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "Живі тентаклі", "note": "", "occasion": 3, "price": 400, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "47": { "id": 47, "animationId": 49, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "b.mhp/2", "type": 3, "variance": 20 }, "description": "Відродити персонажа з 50% ЗД.", "effects": [{ "code": 44, "dataId": 105, "value1": 1, "value2": 0 }, { "code": 22, "dataId": 1, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 181, "itypeId": 1, "name": "Покращене відродження", "note": "", "occasion": 0, "price": 100, "repeats": 1, "scope": 9, "speed": 0, "successRate": 100, "tpGain": 0 }, "48": { "id": 48, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "", "note": "", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "49": { "id": 49, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Пріоритет ворога", "note": "<SG説明:\nВраг всегда будет в первую очередь атаковать \\c[27]Элину\\c[0].\nОни переключатся на союзников, только если \nЭлина будет одолена.>\n<SGカテゴリ:Геймплей> ", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "50": { "id": 50, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Книга, що навчає заклинання Золотий вітер.", "effects": [{ "code": 43, "dataId": 156, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 191, "itypeId": 1, "name": "Книга чарівника вітру", "note": "", "occasion": 2, "price": 8000, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "51": { "id": 51, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Стати", "note": "<SG説明:\\i[28]Озабоченность\n\\c[27]Сексуальная Защита\\c[0] уменьшается в двое и\n\\c[27]Очарование\\c[0] в 1.5 раза сильнее.\n\n\\i[11]Мазохизм\n\\c[27]Атаки\\c[0] становятся в 3 раза мощнее.\nЕсть шанс, что цель освободится при получении урона.\n\n\\i[9]Путы\nНельзя выполнять действия в течении 2-4 ходов.\nЕсть шанс, что цель освободится при получении урона.\n\nСтраница(1/3)>\n<SG説明2:\\i[84]Очарование\n\\c[27]Любовные\\c[0] атаки наносят двойной урон.\n\n\\i[7]Похоть\nВсе навыки отключаются, кроме мастурбации.\n\n\\i[23]Божественный Щит\nЗащита, данная суккубам, которая делает их\nневосприимчивыми ко всем физическим и магическим атакам.\n\nСтраница(2/3)>\n<SG説明3:\\i[4]Безмолвие\nНельзя использовать навыки.\n\n\\i[2]Отравление\nЦель получает 20% HP урона каждый ход.\n\n\\i[8]Сон\nНельзя использовать навыки 3-5 ходов.\nМожно снять, если цель получит урон.\n\nСтраница(3/3)>\n<SGカテゴリ:Геймплей>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "52": { "id": 52, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 3, "name": "Спогади", "note": "<SG説明:Как только вы посмотрите H-Сцену, вы закончите игру.\nПосле этого у вас навсегда откроется \nэта сцена в ваших снах.>\n<SGカテゴリ:Геймплей>", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "53": { "id": 53, "animationId": 155, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Зілля, яке дозволяє закохатися у себе. (Чарівність 100%)", "effects": [{ "code": 21, "dataId": 8, "value1": 1, "value2": 0 }], "hitType": 0, "iconIndex": 176, "itypeId": 1, "name": "Зілля любові", "note": "<mat1:I7*2>\n<mat2:I8*1>\n<matG:50>", "occasion": 1, "price": 100, "repeats": 1, "scope": 1, "speed": 0, "successRate": 100, "tpGain": 0 }, "54": { "id": 54, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Це згусток магічної сили. (Підвищення рівня)", "effects": [], "hitType": 0, "iconIndex": 305, "itypeId": 1, "name": "Чарівний кристал", "note": "<level_up>\n", "occasion": 2, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "55": { "id": 55, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "", "note": "", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "56": { "id": 56, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Слиз", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Футанари суккуб с телом из слизи.\nОни довольно слабые, но могут проглатывать \nсвоих врагов, так что будьте осторожны.\n◆Рост:100◆Грудь:82◆Талия:52◆Бёдра:70◆Член:8\nДроп：Кусочки слизи>\n<SGピクチャ:Actor_2>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_2>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "57": { "id": 57, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Молодший суккуб", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Человек, которого Римуруру превратила в суккуба.\nДумает только о сексе.\n◆Рост:160◆Грудь:104◆Талия:55◆Бёдра:87◆Член:18\nДроп : Кусок ткани>\n<SGピクチャ:Actor_7>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_7>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "58": { "id": 58, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Імп", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Высокоранговый футанари суккуб.\nМанипулирует людьми, делая их озабоченными.\n◆Рост:164◆Грудь:114◆Талия:57◆Бёдра:92◆Член:23 \nДроп : Магический фрагмент, Зелье лечения>\n<SGピクチャ:Actor_9>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_9>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "59": { "id": 59, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Перевертень", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Пушистый кот-монстр превратившийся в суккуба.\nИмеет тонкий пенис с шипом, который при проникании вызывает \nещё больше возбуждения.\n◆Рост:139◆Грудь:69◆Талия:48◆Бёдра:57◆Член:16\nДроп: Волосы животного>\n<SGピクチャ:Actor_3>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_3>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "60": { "id": 60, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Дріада", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Футанари суккуб, воплощение духа растений.\nОгромные яички, способствуют обильной эякуляции.\n◆Рост:149◆Грудь:80◆Талия:52◆Бёдра:71◆Член:12\nДроп: Тентакли Дриады, Гриб >\n<SGピクチャ:Actor_10>\n<SG説明2: >\n<SGピクチャ2:Actor_10>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "61": { "id": 61, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Ламія", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Суккуб с нижней змеиной половинкой.\nИзвестен тем, что способен несколько дней подряд насиловать человека.\n◆Рост:238◆Грудь:112◆Талия:70◆Бёдра:139◆Член:20・25\nДроп : Чешуя Ламии>\n<SGピクチャ:Actor_5>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_5>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "62": { "id": 62, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Суккуб", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Суккуб создан из человека \nс помощью сил Римуру и Быка.\n◆Рост:175◆Грудь:230◆Талия:80◆Бёдра:110◆Член:19>\n<SGピクチャ:Actor_11>\n<SG説明2: Грудь быстро увеличивается, если её не доить.\nДроп : Коровье молочко, Кусок ткани>\n<SGピクチャ2:Actor_11>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:Actor_11>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "63": { "id": 63, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Кентавр", "note": "<SGカテゴリ:Суккубы> \n<SG説明:<SGカテゴリ:Суккубы> \n<SG説明:Суккуб с нижней лошадиной половинкой.\nВсегда возбуждены, потому что не могут мастурбировать.\n◆Рост:314◆Грудь:135◆Талия:102◆Бёдра:197◆Член:70\nДроп : Волосы животного, Магический фрагмент>\n<SGピクチャ:Actor_12>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_12>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "64": { "id": 64, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Таурос", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Футанари корова неизвестного происхождения\n◆Рост:197◆Грудь:414◆Талия:88◆Бёдра:138◆Член:60>\n<SGピクチャ:Actor_6>\n<SG説明2: У тех, кто пьёт её молоко, выростает огромная грудь.>\n<SGピクチャ2:Actor_6>\n<SG説明3: Пенис располагается между её груди и достигающий рта.\nДроп : Коровье молочко, Вкусный сыр>\n<SGピクチャ3:Actor_6>\n\n<SGピクチャ位置:top>\n<SG説明4: >\n<SGピクチャ4:Actor_6>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "65": { "id": 65, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Перевертень", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Волк оборотень превратившийся в суккуба.\nЛюбит анальные игры.\n◆Рост:159◆Грудь:91◆Талия:60◆Бёдра:93◆Член:15\nДроп : Клыки Демона, Сексуальные волосы животного>\n<SGピクチャ:Actor_4>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_4>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "66": { "id": 66, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Дракон", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Слабый дракон превратившийся в суккуба.\nЛюбит садистские игры, а так же фистинг.\n◆Рост:164◆Грудь:81◆Талия:53◆Бёдра:92◆Член:20・20\nДроп : Магический фрагмент, Коготь Дракона>\n<SGピクチャ:Actor_13>\n<SG説明2: >\n<SGピクチャ2:Actor_13>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:Actor_13>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "67": { "id": 67, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Рукорумон", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Король Демонов убитый Римуруру.\nОбладает чрезвычайно мощной магией.\n◆Рост:131◆Грудь:54◆Талия:49◆Бёдра:60◆Член:????\nДроп : Магический фрагмент, Волшебный кристал>\n<SGピクチャ:ルコルモン_1_3>\n<SG説明2:Она ещё не научилась управлять своим телом суккуба, \nпоэтому размер её члена огромен. Как только она научится \nконтролировать его, он вернётся к более разумным размерам.>\n<SG説明3:Её интерес к мировому господству остыл, \nи всё что она хочет, так это просто сексе.>\n<SGピクチャ2:ルコルモン_1_2>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:ルコルモン_1_2>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "68": { "id": 68, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Двійник", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Футанари, превращающийся в противника.\nПытается слиться с обществом, но забывает прятать член.\n◆Рост:???◆Грудь:???◆Талия:???◆Бёдра:???◆Член:???\nДроп : Супер зелье восстановления, Трава воскрешения>\n<SGピクチャ:Actor_18>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:Actor_18>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "69": { "id": 69, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Рімуруру", "note": "<SGカテゴリ:Суккубы> \n<SG説明:Главный суккуб, ответственный за нашествия.\nИмеет возбуждающее кольцо у основания члена.\n◆Рост:143◆Грудь:152◆Талия:50◆Бёдра:74◆Член:40>\n<SG説明2:Любой, кто изнасилует кого-нибуть с этим \nвозбуждающим кольцом, превратится в суккуба.\nДроп : Демоническое кольцо возбуждения>\n<SGピクチャ:rumiruru1_3>\n<SGピクチャ2:rumiruru1_3>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:rumiruru1_3>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "70": { "id": 70, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Еліна", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Только что обученный маг. Хочет заняться \nчем-то другим, кроме сбора трав.\n◆Рост:159◆Грудь:88◆Талия:55◆Бёдра:72◆Член:13>\n<SG説明2:Имеет посох с магическим камнем на верху.>\n<SG説明3:Стала суккубом, но, возможно, прославится, \nесли решит проблему с суккубами.>\n<SGピクチャ:Irene2_1>\n<SGピクチャ2:Irene1_0>\n<SGピクチャ3:Irene6_3>\n<SGピクチャ位置:top>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "71": { "id": 71, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Реєстратор", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Регистратор гильдии авантюристов.\nВсегда очень приветлива с людьми.\n◆Рост:142◆Грудь:70◆Талия:52◆Бёдра:63>\n<SGピクチャ:uketuke1_2>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:uketuke1_2>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "72": { "id": 72, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Торговець антикваріатом", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Владелец магазина с огромной грудью.\nОна намеренно соблазняет мужчин!?\n◆Рост:179◆Грудь:202◆Талия:73◆Бёдра:125>\n<SGピクチャ:tensyu1_3>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:tensyu1_3>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "73": { "id": 73, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Торговець зброєю", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Дочь первоначального владельца магазина.\nНадеюсь, она сможет делать экипировку \nтак же хорошо, как её отец.\n◆Рост:150◆Грудь:63◆Талия:56◆Бёдра:64>\n<SGピクチャ:bukiya>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:bukiya>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "74": { "id": 74, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Сестра", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Сестра в церкви.\nИзвестна тем, что может утешить кого угодно.\n◆Рост:155◆Грудь:99◆Талия:58◆Бёдра:110>\n<SG説明2:Люди приходят в исповедальню каждый день.\nЕсть ли у неё какой-то секрет?>\n<SGピクチャ:sister>\n<SGピクチャ2:sister>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:sister>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "75": { "id": 75, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Наталіна", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Легендарный Авантюрист.\nПреследует Римуруру, чтобы вернуть своё прежнее тело\n◆Рост:177◆Грудь:109◆Талия:54◆Бёдра:90◆Член:18>\n<SGピクチャ:natari1_8>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:natari1_8>\n", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "76": { "id": 76, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Ювелір", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Лучшая грудь в городе.\nОчаровывает всех клиентов мужчин.\n◆Рост:185◆Грудь:210◆Талия:73◆Бёдра:119>\n<SGピクチャ:housekisan>\n<SGピクチャ位置:top>\n<SG説明2: >\n<SGピクチャ2:housekisan>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "77": { "id": 77, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Кролик", "note": "<SGカテゴリ:Персонажи> \n<SG説明2:Отвлекает людей в азартных играх\nсвоей большой грудью.\n◆Рост:168◆Грудь:162◆Талия:59◆Бёдра:91>\n<SGピクチャ:bani1>\n<SGピクチャ2:bani1>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:bani1>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "78": { "id": 78, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 4, "name": "Дівчина з рани", "note": "<SGカテゴリ:Персонажи> \n<SG説明:Работает в молочном магазине.\n◆Рост:155◆Грудь:179◆Талия:53◆Бёдра:84>\n<SG説明2:Скрещивает руки, чтобы держать грудь.\nОбеспокоена нехваткой молока.>\n<SGピクチャ:milk1>\n<SGピクチャ2:milk1>\n<SGピクチャ位置:top>\n<SG説明3: >\n<SGピクチャ3:milk1>\n", "occasion": 3, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "79": { "id": 79, "animationId": 0, "consumable": false, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "Вам будуть снитися непристойні сни.", "effects": [], "hitType": 0, "iconIndex": 145, "itypeId": 2, "name": "Сережка суккуба", "note": "", "occasion": 3, "price": 20, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }, "80": { "id": 80, "animationId": 0, "consumable": true, "damage": { "critical": false, "elementId": 0, "formula": "0", "type": 0, "variance": 20 }, "description": "", "effects": [], "hitType": 0, "iconIndex": 0, "itypeId": 1, "name": "", "note": "", "occasion": 0, "price": 0, "repeats": 1, "scope": 7, "speed": 0, "successRate": 100, "tpGain": 0 }
		}
		// \s*[\r\n]+\s*
		console.log(
			//@ts-ignore
			Object.values(t).map(item => typeof item === 'object' && item !== null ? { ...item, '\n': '' } : `${item}\n`))

		// ("parameters":\s*\["[^"]{60,300}?)\s([^"]*)
		// $1\\n$2
	}

	// Працюємо з поточним файлом декларативно
	public currentFile = computed(() => {
		const index = this.selectedFileIndex();
		return index !== null ? this.filesList()[index] : null;
	});

	// Замість окремого сигналу робимо computed-геттер для таблиці UI
	public csvContent = computed(() => this.currentFile()?.parsedData ?? []);
	public chunks = computed(() => this.currentFile()?.chunks ?? []);

	// Обробка вибору/додавання нових файлів
	onFileChange(event: any) {
		const files: FileList = event.target.files;
		if (!files.length) return;

		const loaders = Array.from(files).map(file => this.readFileAsync(file));

		Promise.all(loaders).then(newFiles => {
			// Створюємо абсолютно новий масив (immutability), щоб сигнал здетонував
			this.filesList.update(current => [...current, ...newFiles]);

			// Автовибір файлу
			if (this.selectedFileIndex() === null) {
				this.selectFile(this.filesList().length - newFiles.length);
			}
		}).catch(err => {
			this.error = err instanceof Error ? err.message : 'Помилка завантаження файлу';
			alert(this.error);
		});
	}

	private readFileAsync(file: File): Promise<UploadedFile> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e: any) => {
				try {
					const content = e.target.result as string;
					const result = this.fileParserService.parseFile(content);
					const initialChunks = this.splitIntoChunks(result, this.chunkSize());

					resolve({
						name: file.name,
						content: content,
						parsedData: result,
						originalParsedData: JSON.parse(JSON.stringify(result)),
						originalContent: JSON.parse(content),
						chunks: initialChunks
					});
				} catch (err) {
					reject(err);
				}
			};
			reader.readAsText(file);
		});
	}

	// Перемикання файлу через селект
	selectFile(index: number) {
		this.selectedFileIndex.set(index);
		this.currentChunkNumber = 0;
		this.olamaResponse.set(null);
		this.error = null;

		// Хедери витягуємо з сервісу парсингу
		if (this.fileParserService.firstLine) {
			this.headerCells.set(this.fileParserService.firstLine.split(','));
		}
	}

	removeFile() {
		if (this.selectedFileIndex() === null) return;

		this.filesList.update(list => {
			const updated = [...list];
			updated.splice(this.selectedFileIndex()!, 1);

			// Якщо видалили останній — скидаємо UI
			if (updated.length === 0) {
				this.selectedFileIndex.set(null);
				this.headerCells.set([]);
			} else if (this.selectedFileIndex()! >= updated.length) {
				// Якщо видалили останній елемент, переключаємось на передостанній
				this.selectFile(updated.length - 1);
			} else {
				// Інакше просто переключаємось на поточний індекс
				this.selectFile(this.selectedFileIndex()!);
			}

			return updated;
		});
	}

	// Тимчасовий хак для виправлення старих файлів:
	onFileSelected(event: any) {
		const files: FileList = event.target.files;

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const reader = new FileReader();

			reader.onload = (e: any) => {
				const fileContent = e.target.result;
				// Замість старту перекладу просто форматуємо і скачуємо назад
				// @ts-ignore
				this.fileExportService.reformatExistingFile(fileContent, file.name);
			};

			reader.readAsText(file);
		}
	}

	// Допоміжний метод для мутації стану поточного файлу
	private updateCurrentFileData(updater: (file: UploadedFile) => void) {
		const index = this.selectedFileIndex();
		if (index === null) return;

		this.filesList.update(list => {
			// 1. Робимо поверхневу копію масиву
			const updatedList = [...list];

			// 2. Глибоко копіюємо саме той файл, який змінюємо
			const fileToUpdate = { ...updatedList[index] };

			// 3. Модифікуємо його копію
			updater(fileToUpdate);

			// 4. Записуємо оновлений об'єкт назад у масив
			updatedList[index] = fileToUpdate;

			return updatedList;
		});
	}

	exportFile(customData?: string[][], customName?: string, originalContent?: string) {
		console.log("Old export");
		// Якщо передали параметри прямо — беремо їх, інакше падаємо на сигнали ( fallback )
		const data = customData || this.currentFile()?.parsedData;
		const name = customName || this.currentFile()?.name;
		const content = originalContent || this.currentFile()?.originalContent;

		if (!data || !name || !content) return;
		this.fileExportService.exportFile([...data], name, content);
	}

	clearData() {
		this.filesList.set([]);
		this.selectedFileIndex.set(null);
		this.currentChunkNumber = 0;
		this.error = null;
	}

	onResetClick() {
		this.updateCurrentFileData(file => {
			file.parsedData = JSON.parse(JSON.stringify(file.originalParsedData));
			file.chunks = this.splitIntoChunks(file.parsedData, this.chunkSize());
		});
		this.currentChunkNumber = 0;
	}

	async applyResponse() {
		const chunk = this.chunks()[this.currentChunkNumber];
		if (!chunk || !this.olamaResponse()) return;

		const result = this.translatorService.applyTranslations(
			chunk,
			this.targetColumn,
			this.olamaResponse()!.items,
			this.olamaResponse()!.map
		);

		const validated = await this.translatorService.validate(
			chunk,
			result,
			this.sourceColumn,
			this.targetColumn
		);

		// Оновлюємо дані всередині активного файлу
		this.updateCurrentFileData(file => {
			const validatedMap = new Map(validated.map(row => [row[0], row]));
			file.parsedData = file.parsedData.map(row => validatedMap.get(row[0]) ?? row);
		});
	}

	async retryTranslate(rowIndex: number) {
		const rowData = this.csvContent()[rowIndex];
		if (!rowData) return;

		const translatedRow = await this.translatorService.translateLine(
			[rowData],
			this.sourceColumn,
			this.targetColumn
		);

		this.updateCurrentFileData(file => {
			file.parsedData[rowIndex] = translatedRow[0];
		});
	}

	async translateCurrentFileWithSmartChunks() {
		const originalTable = this.csvContent();
		const rowsToTranslate: TranslatedRow[] = originalTable.map((row, index) => ({
			globalIndex: index,
			id: row[0],
			sourceText: row[1],
			targetText: '',
			isTranslated: false,
			retryCount: 0
		}));
		console.log('translateCurrentFileWithSmartChunks', rowsToTranslate);
		let finalTranslatedRows: TranslatedRow[] = [];

		// 👈 ЗАПУСКАЄМО СТВОРЕННЯ ТА ПЕРЕКЛАД В КОНТЕКСТІ ІНЖЕКЦІЇ
		await runInInjectionContext(this.injector, async () => {

			// Тепер Chunk може безпечно використовувати inject() всередині себе!
			const mainChunk = new Chunk(
				'root_file',
				rowsToTranslate,
				this.sourceColumn,
				this.targetColumn,
				5
			);

			console.log('🚀 Запуск розумного конвеєра перекладу з DI...');
			finalTranslatedRows = await mainChunk.translate();
			console.log('finalTranslatedRows', finalTranslatedRows);
		});

		// Оновлюємо стан нашої таблиці
		this.updateCurrentFileData(file => {
			const updatedTable = [...file.parsedData];

			finalTranslatedRows.forEach(row => {
				updatedTable[row.globalIndex][2] = row.targetText;
			});

			file.parsedData = updatedTable;
		});

		console.log('🎉 Переклад завершено!');
	}

	async translateAndDownloadAllFiles() {
		const allFiles = this.filesList();
		if (allFiles.length === 0) return;

		this.isAutoTranslating = true;
		this.error = null;

		try {
			for (let i = 0; i < allFiles.length; i++) {
				if (!this.isAutoTranslating) break;

				// 1. Перемикаємося на потрібний файл у UI/стані
				this.selectFile(i);
				console.log(`--- Старт розумного пакетного перекладу файлу [${i + 1}/${allFiles.length}]: ${allFiles[i].name} ---`);

				// Чекаємо оновлення сигналів
				await new Promise(resolve => setTimeout(resolve, 150));

				// Фіксуємо поточний файл з масиву локально в ітерації, щоб уникнути стрибків сигналів
				const targetFile = allFiles[i];
				const originalTable = targetFile.parsedData;

				const rowsToTranslate: TranslatedRow[] = originalTable.map((row, index) => ({
					globalIndex: index,
					id: row[0],
					sourceText: row[1],
					targetText: '',
					isTranslated: false,
					retryCount: 0
				}));

				let finalTranslatedRows: TranslatedRow[] = [];

				// 3. Запускаємо Root-Чанк
				await runInInjectionContext(this.injector, async () => {
					const mainChunk = new Chunk(
						`root_${targetFile.name}`,
						rowsToTranslate,
						this.sourceColumn,
						this.targetColumn,
						200
					);
					finalTranslatedRows = await mainChunk.translate();
				});

				// Масив для збереження фінального результату саме цієї ітерації
				let tableToExport: string[][] = [];

				// 4. Мапимо отриманий переклад в наш сервіс стану
				this.updateCurrentFileData(file => {
					const updatedTable = [...file.parsedData];

					finalTranslatedRows.forEach(row => {
						updatedTable[row.globalIndex][2] = row.targetText;
					});

					file.parsedData = updatedTable;
					tableToExport = updatedTable; // Записуємо посилання на свіжі дані
				});

				console.log("tableToExport", tableToExport);
				console.log("this.isAutoTranslating", this.isAutoTranslating);
				console.log("this.error", this.error);
				// 5. 👈 ФІКС ТУТ: Скачуємо файл, передаючи дані ЛОКАЛЬНО
				if (this.isAutoTranslating && this.error === null && tableToExport.length > 0) {
					console.log(`Файл ${targetFile.name} повністю оброблено. Завантажуємо...`);
					// Передаємо дані ТУТ в обхід computed сигналів!
					this.exportFile(tableToExport, targetFile.name);
				}

				// Чистимо стан для візуального відображення в інтерфейсі перед наступним файлом
				this.currentChunkNumber = 0;
				this.olamaResponse.set(null);

				await new Promise(resolve => setTimeout(resolve, 500));
			}

			if (this.isAutoTranslating && this.error === null) {
				console.log('🎉 Усі файли успішно оброблено розумним конвеєром!');
			}

		} catch (error) {
			console.error('Помилка під час пакетного перекладу файлів:', error);
			this.error = 'Пакетний переклад перервано через критичну помилку.';
		} finally {
			this.isAutoTranslating = false;
		}
	}

	async nextChunk() {
		this.currentChunkNumber++;
	}

	async startAutoTranslation() {
		this.isAutoTranslating = true;
		await this.translateCurrentFileWithSmartChunks();
		this.isAutoTranslating = false;
	}

	stopAutoTranslation() {
		this.isAutoTranslating = false;
	}

	updateResponse(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		this.olamaResponse.update(data => {
			if (!data) return data;
			return { ...data, rowResponse: textarea.value };
		});
	}

	private splitIntoChunks(csvContent: string[][], chunkSize: number) {
		return this.chunkService.splitByCharacters(csvContent, this.sourceColumn, chunkSize);
	}

	copyToClipboard() {
		const content = this.fileExportService.generateString(this.csvContent());
		navigator.clipboard.writeText(content);
	}

	updateFullTable(newTable: string[][]) {
		this.updateCurrentFileData(file => {
			file.parsedData = newTable;
		});
	}
}
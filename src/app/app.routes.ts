import { Routes } from '@angular/router';
import { FileUploadComponent } from './file-upload/file-upload';
import { CsvMergerComponent } from './csv-merger/csv-merger';
import { NaninovelComponent } from './naninovel/naninovel';
import { FILE_PARSER_TOKEN, FILE_EXPORT_TOKEN } from './tokens/file-processor.tokens';
import { FileParserService } from './services/file-parser.service';
import { FileExportService } from './services/file-export.service';
import { NaninovelFileParserService } from './services/naninovel-file-parser.service';
import { NaninovelFileExportService } from './services/naninovel-file-export.service';
import { PROMPT_STRATEGY_TOKEN } from './tokens/prompt-strategy.token';
import { CsvPromptStrategy } from './strategies/csv-prompt.strategy';
import { MonoBehaviourPromptStrategy } from './strategies/monobehaviour-prompt.strategy';
import { MonoBehaviourFileParserService } from './services/monobehaviour-file-parser.service';
import { MonoBehaviourFileExportService } from './services/monobehaviour-file-export.service';
import { NaninovelPromptStrategy } from './strategies/naninovel-prompt.strategy copy';
import { RpgMakerFileExportService } from './rpg-marker/services/rpg-maker-file-export.service';
import { RpgMakerPromptStrategy } from './rpg-marker/strategis/rpgmaker-prompt.strategy';
import { RpgMakerFileParserService } from './rpg-marker/services/rpg-maker-file-parser.service';
import { RPGAdvanceUploadComponent } from './rpg-advance-upload/rpg-advance-upload';
import { RpgMarkerQuality } from './features/rpg-marker-quality/pages/rpg-marker-quality/rpg-marker-quality';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'merge',
        pathMatch: 'full'
    },
    {
        path: 'upload',
        component: FileUploadComponent,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: FileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: FileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: CsvPromptStrategy }
        ]
    },
    {
        path: 'naninovel',
        component: FileUploadComponent,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: NaninovelFileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: NaninovelFileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: NaninovelPromptStrategy }
        ]
    },
    {
        path: 'monoBehaviour',
        component: FileUploadComponent,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: MonoBehaviourFileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: MonoBehaviourFileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: MonoBehaviourPromptStrategy }
        ]
    },
    {
        path: 'rpgmaker',
        component: FileUploadComponent,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: RpgMakerFileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: RpgMakerFileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: RpgMakerPromptStrategy }
        ]
    },
    {
        path: 'rpgmaker/system',
        component: RPGAdvanceUploadComponent,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: RpgMakerFileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: RpgMakerFileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: RpgMakerPromptStrategy }
        ]
    },
    {
        path: 'rpgmaker/quality',
        component: RpgMarkerQuality,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: RpgMakerFileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: RpgMakerFileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: RpgMakerPromptStrategy }
        ]
    },
    {
        path: 'merge',
        component: CsvMergerComponent,
        providers: [
            { provide: FILE_PARSER_TOKEN, useClass: FileParserService },
            { provide: FILE_EXPORT_TOKEN, useClass: FileExportService },
            { provide: PROMPT_STRATEGY_TOKEN, useClass: CsvPromptStrategy }
        ]
    }
];

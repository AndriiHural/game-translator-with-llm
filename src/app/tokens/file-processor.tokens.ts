import { InjectionToken } from '@angular/core';
import { IFileExport, IFileParser } from './file-processor.type';

// Токени для DI
export const FILE_PARSER_TOKEN = new InjectionToken<IFileParser>('FILE_PARSER_TOKEN');
export const FILE_EXPORT_TOKEN = new InjectionToken<IFileExport>('FILE_EXPORT_TOKEN');
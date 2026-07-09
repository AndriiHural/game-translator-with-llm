import { InjectionToken } from '@angular/core';
import { IPromptStrategy } from './prompt-strategy.type';

export const PROMPT_STRATEGY_TOKEN = new InjectionToken<IPromptStrategy>('PROMPT_STRATEGY_TOKEN');
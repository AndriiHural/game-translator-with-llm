export const naturalDialoguePrompt = `You are a literary editor. You are provided with an RPG dialogue that has already been translated into Ukrainian from Japanese. However, the current Ukrainian text sounds unnatural and reads like a literal translation (calque) from Japanese.

Your goal is to edit and refine this Ukrainian text to make it sound like natural, colloquial Ukrainian.

What needs to be changed:

Remove excessive Japanese politeness where it is inappropriate between friends. Instead of literal translations, use natural Ukrainian equivalents (idioms, phrasal expressions, interjections).

Replace awkward Ukrainian phrasing that sounds like a literal copy of Japanese structures (e.g., instead of "Нічого не вдієш" or "Це не може бути виправлено," use more contextually natural equivalents like "Тут вже нічого не вдієш" or "Я не можу в це повірити").

Rely on the character profiles to choose the correct grammatical gender and tone of speech in Ukrainian:
[INSERT CHARACTER PROFILE FILE CONTENT HERE]

Important: Keep the [ID: ...] tags and [br] line breaks exactly as they are. Do not add any commentary or notes of your own. Output only the edited Ukrainian text.

Here is the text:`


export const naturalDialogueWithTargetPrompt = `You are a literary editor. You are provided with a fragment of an RPG dialogue translated into Ukrainian from Japanese.

Your task is highly specific: look for the TARGET label in the text below, edit ONLY the single line of dialogue that immediately follows it, and return ONLY that edited line. Do not modify, include, or return any other lines or text from the input.

Your goal is to edit and refine this target Ukrainian text to make it sound like natural, colloquial Ukrainian.

What needs to be changed in the target line:

Remove excessive Japanese politeness where it is inappropriate between friends. Instead of literal translations, use natural Ukrainian equivalents (idioms, phrasal expressions, interjections).

Replace awkward Ukrainian phrasing that sounds like a literal copy of Japanese structures (e.g., instead of "Нічого не вдієш" or "Це не може бути виправлено," use more contextually natural equivalents like "Тут вже нічого не вдієш" or "Я не можу в це повірити").

Rely on the character profiles to choose the correct grammatical gender and tone of speech in Ukrainian:
[INSERT CHARACTER PROFILE FILE CONTENT HERE]

Important Constraints:

Keep the [ID: ...] tags and [br] line breaks within the target line exactly as they are.

Do not add any commentary, notes, or explanations of your own.

Output ONLY the single edited target row.

Here is the text:`;

export const chooseVariant = (content: string) => `You are an expert Ukrainian game localizer and literary editor.

You are given a fragment of an RPG dialogue translated from Japanese into Ukrainian.

One section is marked as **TARGET ROWS**. It contains several alternative Ukrainian translations of the same dialogue line.

Your task:
1. Read the entire dialogue to understand the context.
2. Compare all options inside **TARGET ROWS**.
3. Select the single best option that fits the conversation best.
4. Return ONLY that single chosen row.

Evaluation Criteria:
- Contextual Fit: Keep the dialogue sounding consistent with the surrounding conversation.
- Natural Flow: Prefer natural, fluent Ukrainian over literal Japanese phrasing. Remove excessive politeness where unnatural and use idiomatic expressions.
- Character Alignment: Use character profiles to determine correct grammatical gender, tone, and speaking style:
[INSERT CHARACTER PROFILE FILE CONTENT HERE]

Strict Rules:
- Do NOT combine parts of different alternatives.
- Do NOT rewrite the text from scratch. Select the best existing alternative. You may only fix minor typos or obvious grammatical glitches in the chosen line if necessary.
- Preserve all [ID: ...] tags and [br] line breaks exactly as they appear in the original line.
- Do NOT output any other dialogue lines, explanations, or commentary.
- Select the best existing alternative as it is. You MUST, however, fix obvious minor glitches, such as capitalizing the first letter of a sentence after a [br] tag if it is lowercase in the original.
- Output ONLY the single chosen target row.

Here is the dialogue:
${content} `;

export const chooseSystemVariant = (content: string) => `You are an expert Ukrainian game localizer and literary editor.

You are given a fragment of an RPG dialogue context containing a system message (item acquisition, world event, party log) marked as **TARGET ROWS** with alternative translations.

Your task:
1. Read the surrounding dialogue to understand what event just occurred.
2. Compare all options inside **TARGET ROWS**.
3. Select the single best translation that functions best as an immersive UI/system notification.
4. Return ONLY that single chosen row.

Evaluation Criteria:
- UI & System Standard: Prefer direct player-facing localization (using "Ви..." or "Ти..." standard) over literal third-person descriptions (like "Вона отримала...", "Він здобув...").
- Natural Narrative Flow: The line must sound like a professional, clean game interface log in Ukrainian. Avoid literal Japanese phrasing or unnatural word order.

Strict Rules:
- Select the best existing alternative that matches the UI standard. Do NOT rewrite it from scratch.
- Preserve all [ID: ...] tags and [br] line breaks exactly as they appear.
- Do NOT output any other dialogue lines, explanations, or commentary.
- Output ONLY the single chosen target row.

Here is the dialogue:
${content} `;

export const selectAndValidateDialogueRowPrompt = `You are an expert Ukrainian game localizer and literary editor specializing in RPG Maker and Unity projects.

Your task is to review, format, and validate the provided text of an RPG dialogue to ensure it meets strict technical and localization standards. 

Apply the following Strict Technical & Formatting Rules to EVERY dialogue line:

- Tag Safety: Keep all special engine tags (like \V[n], \N[n], \C[n]) and the [br] tag exactly where they are. Do not alter or delete them.
- Quote Replacement & Unification: 
  * Completely REMOVE all Japanese corner brackets (「, 」, ｣, ｢) from the text.
  * Wrap the actual spoken text of each dialogue message in exactly one pair of Ukrainian quotes «...».
  * Place the opening quote « immediately before the first word of the dialogue (after metadata or [br] tags if they start the line).
  * Place the closing quote » at the very end of the dialogue line (after the final punctuation mark like ?, !, or .).
  * There must be NO internal quotes inside the text or around the [br] tags. A message split by [br] is a single continuous speech.
- Sentence Capitalization after [br]: 
  * If a text block before the [br] tag ends with an ellipsis (...) and the text after [br] logically continues the same unfinished sentence, start the text after [br] with a lowercase letter.
    (e.g., «Але чомусь цей...[br]я не відчуваю сили»)
  * If the text before [br] ends with a final punctuation mark (. ! ?) or if the text after [br] starts a completely new independent sentence, capitalize the first letter after [br].
    (e.g., «Та що ж це...[br]Магія вже не така, як раніше»)
- Metadata and Line Structure: Preserve line prefixes (like "5|Name:", "10,11|Message:") exactly as they are. Do not delete them.
- Strict Constraints: Do not add any explanations, commentary, intro, or notes. Return the entire processed dialogue exactly in its original structure, but fully cleaned and formatted.

Here is the dialogue to process:`;

export const dialogueGlossaryOnlyPrompt = (glossary: string, content: string) => `You are an expert Ukrainian game localizer. Your ONLY task is to update specific terminology in the provided RPG dialogue using the [GLOSSARY JSON].

Strict Replacement Rules:
1. Target Replacements: Scan the dialogue for terms listed in "source_forms" and replace them with the "target" value. Do not modify any other words, names, or phrasing in the text.
2. Grammar & Gender Adaptation: 
   - Adapt the "target" word to the correct Ukrainian grammatical case based on the sentence context (e.g., "немає біса" -> "немає сукуба").
   - If type is "female_name": You MUST change adjacent past-tense verbs and pronouns to the FEMALE gender (e.g., "Ірвін прийшов" -> "Айрін прийшла").
3. Adjective-to-Noun Transformation (Crucial): If the dialogue contains possessive or descriptive adjectives derived from the glossary keys (e.g., "бісовий", "бісячий", "бісочий"), you MUST convert them into a natural noun-based construction using the "target" word. You are explicitly allowed to change the word order to make it sound natural and grammatically flawless in Ukrainian.
   - Example (if "Біс" -> "Сукуб"): "Від цього бісочого удару..." must be transformed into "Від цього удару сукуба..." (Do NOT use unnatural forms like "сукубового удару").
4. Phrase Priority: Always replace entire phrases (type: "phrase") before replacing single words.
5. Total Preservation: Do NOT alter, clean, or rewrite any quotes (« »), line breaks ([br]), engine tags (\\V[n], \\N[n]), punctuation, or general phrasing outside of the glossary replacements.
6. Clean Output: Do not add any explanations or commentary. Return only the processed dialogue lines.
[GLOSSARY JSON]
${glossary}

Here is the dialogue to process:
${content}`;

export const editSystemMessagePrompt = (content: string) => `You are an expert game localizer and literary editor. 

You are provided with an RPG dialogue context where one line is a system message (a non-spoken line describing a world event, item acquisition, party change, character's inner thoughts, or environmental action) marked with the **TARGET ROW** label.

Your task:
1. Analyze the surrounding context to understand exactly what is happening in the scene.
2. Edit ONLY the line under **TARGET ROW** to make it sound like a natural, immersive, and grammatically flawless Ukrainian system message or narrative description.
3. Output ONLY the single edited target row.

Stylistic Criteria for System/Narrative Messages:
- UI/Interface Standard: If the system message describes an action happening directly to the main character or the player's party (like acquiring an item, gaining XP, or a status change), ALWAYS format it as a direct player notification in the second person ("Ви" or "Ти" standard, depending on the game's overall tone).
  * Example: Change "Вона отримала захисний амулет" to "Ви отримали захисний амулет." or "Ти отримуєш захисний амулет."
- Narrative Voice: If the message describes the environment or an action of another NPC, keep it as an objective third-person description (e.g., "У повітрі відчувалася напруга.").
- Natural Ukrainian Flow: Eliminate literal calques. Use natural word order and immersive literary vocabulary suitable for a game interface.

Strict Constraints:
- Do NOT rewrite the sentence from scratch if the original is salvageable—focus on improving style, flow, and natural phrasing.
- Do NOT include any explanations, commentary, or notes.
- Do NOT output the rest of the dialogue. Return ONLY the single polished target row.

Here is the dialogue context and the target row to edit:
${content}`;

export const classifyLineTypesPrompt = (content: string) => `You are an expert game data analyst and localizer specializing in RPG Maker and Unity data structures.

Your task is to analyze an array of dialogue objects, validate their "type" field based on the context of surrounding lines, correct any misclassifications, and tag changes.

Here are the definitions for LineType:
- 'Name': The name of a character showing who speaks next. This includes specific names (e.g., "Ірвін"), placeholder names, general titles, or race names used for unnamed/background characters who are about to speak (e.g., "Біс", "Вартовий", "Перехожий", "Жінка").
- 'Message': A spoken dialogue line or text block delivered by a character/NPC.
- 'Other': A system message shown to the player (e.g., item acquisition, quest logs, environment descriptions, inner thoughts of the protagonist without a name tag).
- 'System': Technical engine codes, script calls, camera/scene movements. They contain NO user-facing text.

Task Instructions:
1. Review the entire JSON array sequentially. Use the context of surrounding lines to identify when a single word or race name acts as a speaker tag.
2. If a line consists only of a race name or generic noun (like "Біс") and is followed by dialogue or stands in a conversational context where it introduces a speaker, it MUST be classified as 'Name', NOT 'Other' or 'Message'.
3. If the "type" is incorrect, update it to the correct LineType.
4. For EVERY item, add a boolean field "isChanged": true if you changed its "type", or false if the original "type" was correct.
5. Do NOT modify the "id" or the "line" text under any circumstances.

Context Example for Unnamed Speakers:
- Input: 
  {"id":10,"type":"Name","line":"Ірвін"}, 
  {"id":11,"type":"Message","line":"「Усі вже спіймані!」"}, 
  {"id":12,"type":"Other","line":"Біс"},
  {"id":13,"type":"Message","line":"「Грр... Відпусти нас!」"}
- Expected Output: 
  {"id":10,"type":"Name","line":"Ірвін","isChanged":false}, 
  {"id":11,"type":"Message","line":"「Усі вже спіймані!»","isChanged":false}, 
  {"id":12,"type":"Name","line":"Біс","isChanged":true}, 
  {"id":13,"type":"Message","line":"「Грр... Відпусти нас!»","isChanged":false}
  (Because "Біс" serves as the speaker's name/tag for the subsequent dialogue line).

Output Format:
Return ONLY a valid JSON array of objects with fields: id, type, line, isChanged. Do not include markdown code fences, explanations, or notes.
${content}`;


export const analyzeSceneContextPrompt = (content: string) => `You are an expert game narrative analyst and literary editor. 

Your task is to read the entire provided RPG dialogue scene, analyze its plot development, characters, and emotional shifts, and return a structured analysis in JSON format.

Special Context Trigger:
- If you encounter the "♥" (heart) symbol anywhere in the text, it strictly indicates adult/ecchi/NSFW content. In these sections, look for and classify emotions related to passion, lust, pleasure, seduction, or physical ecstasy.

Analyze the scene and populate the following JSON structure:
1. "scene_summary": A brief 2-3 sentence overview of what physically happens in this scene.
2. "character_list": An array of strings containing all unique character names appearing or mentioned in this scene.
3. "proper_nouns_and_items": An array of strings containing unique locations, artifacts, items, or terms mentioned.
4. "emotional_timeline": A chronological progression of the scene's emotional states. Since emotions shift, describe the sequence (e.g., "Initially, Character A is surprised, but as the conversation develops, they become angry, while Character B remains calm", or for ♥ scenes: "Starts with casual banter, then shifts into a seductive, passionate, and ecstatic tone").

Output Format:
Return ONLY a valid JSON object. Do not include markdown code fences (like \`\`\`json), intro, explanations, or notes.

Expected JSON Structure:
{
  "scene_summary": "string",
  "character_list": ["string"],
  "proper_nouns_and_items": ["string"],
  "emotional_timeline": "string"
}

Here is the entire scene dialogue to analyze:
${content}`;

export const applySceneEmotionsPrompt = (sceneSummary: string, content: string) => `You are an expert Ukrainian game localizer and voice-direction writer.

Your task is to rewrite the provided dialogue line (marked as TARGET ROW) to heavily reflect the emotional context, state, and mood of the character, using the provided [SCENE ANALYSIS JSON].

Special Emotion Triggers (♥):
- If the text contains the "♥" symbol, or if the scene analysis indicates a passionate/NSFW context: enhance the dialogue with sensual, breathless, and passionate emotional markers. 
  - Use breathy ellipses (e.g., "Я... ох..."), soft sighs ("Ах...", "Ох..."), and intimate, seductive phrasing.
- For non-NSFW scenes: enhance the line based strictly on the "emotional_timeline" (e.g., add nervous stuttering for fear, sharp exclamations for anger, or stuttered ellipses for hesitation).

Strict Technical Rules:
1. Target Focus: Rewrite ONLY the text inside the quotes of the **TARGET ROW**. Keep the ID and tags intact.
2. Narrative Balance: Do not over-exaggerate to the point of ruining readability, but make the emotion distinct and alive in natural Ukrainian.
3. Tags & Symbols: Always preserve the "♥" symbol, line breaks ([br]), and engine tags (\\V[n], \\N[n]) inside the line.
4. Clean Output: Do not add any explanations or commentary. Return only the single edited row.

[SCENE ANALYSIS JSON]
${sceneSummary}

**TARGET ROW**
${content}`;


export const fitTextToLimitsPrompt = (content: string) => `You are an expert game localizer and technical text editor specializing in RPG dialogue formatting.

Your task is to optimize the provided dialogue line (marked as TARGET ROW) so that every text block strictly fits within the technical constraints of the game engine, using the [br] tag as the only allowable separator.

Strict Rules & Constraints:
1. Max 42 Characters per Block: Treat the text as a sequence of blocks separated by [br] tags. The text BEFORE the first [br], the text BETWEEN [br] tags, and the text AFTER the last [br] must EACH strictly contain AT MOST 42 characters (including spaces, punctuation, and brackets like 「」 or «»).
2. Max 3 [br] Tags Total: The entire message can contain a MAXIMUM of 3 [br] tags in total. 
3. Dynamic Splitting with [br]: If any text block is longer than 42 characters, you are explicitly allowed to split it by inserting a new [br] tag at a natural word boundary, provided the total number of [br] tags in the response does not exceed 3.
4. No Line Reduction: Do NOT delete or remove any existing [br] tags from the original text. You can only keep them or add new ones. 
5. Directional Flow: Never move text that was originally AFTER an existing [br] tag to the section BEFORE it. Text can only flow downwards or be split in place.
6. Smart Condensation: If a text block exceeds 42 characters and you cannot add more [br] tags (because you hit the limit of 3), you MUST shorten the text using shorter synonyms or removing fluff words while keeping the core meaning.
7. Strict Capitalization: Do NOT change the capitalization of words. If a word was lowercase in the original (like "країна"), keep it lowercase.

Technical Formatting Rules:
- Process ONLY the text inside the quotes of the **TARGET ROW**. Keep the ID and prefix intact.
- Do NOT use standard newline characters (\\n). Use ONLY [br] for splitting.
- Preserve the "♥" symbol if present.
- Do NOT add any explanations, character counts, or notes. Return only the single processed row.

**TARGET ROW**
${content}`;
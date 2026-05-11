/**
 * WhatsApp Template Variable Helpers
 * 
 * Supports both numeric {{1}} and named {{order_id}} variables.
 * Default type is 'number'.
 */

export const VAR_REGEX = {
    number: /\{\{(\d+)\}\}/g,
    named: /\{\{([\w_]+)\}\}/g,
    any: /\{\{([\w\d_]+)\}\}/g,
    malformed: /\{[^{}]*\}|\{\{[^{}]*\}\}/g
};

/**
 * Get all variable matches from text
 */
// type =  'number' | 'named' | 'any'
export const getVariableMatches = (text = "", type = 'number') => {
    const regex = VAR_REGEX[type];
    return text.match(regex) || [];
};

/**
 * Extract variable names/numbers from text
 */
export const extractVariableNames = (text = "", type = 'number') => {
    const regex = VAR_REGEX[type];
    const matches = [];
    let match;
    const searchRegex = new RegExp(regex.source, 'g');
    while ((match = searchRegex.exec(text)) !== null) {
        matches.push(match[1]);
    }
    return matches;
};

/**
 * Replace variables with custom logic
 */
export const replaceVariables = (
    text,
    callback,
    type = 'number'
) => {
    const regex = new RegExp(VAR_REGEX[type].source, 'g');
    return text.replace(regex, callback);
};

/**
 * Validate if a part is a correct variable format
 */
export const isCorrectVariableFormat = (part, type = 'number') => {
    const regex = new RegExp(`^${VAR_REGEX[type].source}$`);
    return regex.test(part);
};  

/**
 * Validate if a part is any kind of bracketed text (potentially malformed var)
 */
export const isPotentialVariable = (part) => {
    return /^\{.*\}$/.test(part) || /^\{\{.*\}\}$/.test(part);
};

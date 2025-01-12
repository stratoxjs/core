
/**
 * Literal manipulations
 * @return {object}
 */
export default function stratoxViteEscapeLiteral() {
    return {
        name: "vite-plugin-escape-template-literals",
        transform(code, id) {
            // Process only JavaScript and TypeScript files
            if (!id.endsWith(".js") && !id.endsWith(".ts")) {
                return null;
            }

            let foundMatch = false;
            let modifiedString = code;

            const matches = [...code.matchAll(/\$\{{([^}]+)\}}/g)];

            matches.forEach((match, index) => {
                foundMatch = true;
                modifiedString = modifiedString.replace(match[0], `\${__url.htmlspecialchars(${match[1]})}`);
            });
            
            return { code: getCode(foundMatch, modifiedString), map: null };
        },
    };
}

/**
 * Add modifications to code with matches
 * @param  {bool} foundMatch
 * @param  {string} code
 * @return {string}
 */
function getCode(foundMatch, code) {
    if(foundMatch) {
        const importStatement = `
            import { UrlHelper as __url } from '@stratox/core';
        `;
        code = importStatement+code;
    }
    return code;
}
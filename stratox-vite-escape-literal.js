export default function stratoxViteEscapeLiteral() {
    // Define characters to escape and their replacements

    return {
        name: "vite-plugin-escape-template-literals",
        transform(code, id) {
            // Process only JavaScript and TypeScript files
            if (!id.endsWith(".js") && !id.endsWith(".ts")) {
                return null;
            }

            // Match all occurrences of the pattern `${...}` and extract the content inside
            const matches = [...code.matchAll(/\$\{{([^}]+)\}}/g)];

            // Modify the extracted values
            const modified = matches.map(match => {
                const value = match[1]; // Extract the content inside `${}`
                return value; // Example modification: make it uppercase
            });

            // Replace the original values in the string with the modified values
            let modifiedString = code;
            matches.forEach((match, index) => {
                modifiedString = modifiedString.replace(match[0], `\${(${modified[index]}).replace(/[&<>"'/]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#x2F;" })[m])}`);
            });

            return { code: modifiedString, map: null };
        },
    };
}

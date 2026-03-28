const vscode = require('vscode');

function activate(context) {

    const diagnostics = vscode.languages.createDiagnosticCollection('fls');

    const keywords = [
    "set",
    "if",
    "else",
    "while",
    "func",
    "return",
    "end",
    "then",
    "console.text",
    "readFile",
    "writeFile"
];

    // --- UPDATE DIAGNOSTICS (RED SQUIGGLES) ---
    function updateDiagnostics(document) {
        if (document.languageId !== 'fls') return;

        const errors = [];
        const lines = document.getText().split('\n');

        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const match = trimmed.match(/^[a-zA-Z\.]+/);
            if (!match) return;

            const word = match[0];

            if (!keywords.includes(word)) {
                const range = new vscode.Range(i, 0, i, word.length);

                const suggestion = getClosestKeyword(word, keywords);

                const message = suggestion
                    ? `Unknown keyword "${word}". Did you mean "${suggestion}"?`
                    : `Unknown keyword "${word}"`;

                errors.push(new vscode.Diagnostic(
                    range,
                    message,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        });

        diagnostics.set(document.uri, errors);
    }

    // Run on open + change
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document))
    );

    // --- AUTOCOMPLETE ---
    const completion = vscode.languages.registerCompletionItemProvider('fls', {
        provideCompletionItems() {

            const items = [];

            function add(label, kind, detail) {
                const item = new vscode.CompletionItem(label, kind);
                item.detail = detail;
                items.push(item);
            }

            add('set', vscode.CompletionItemKind.Keyword, 'Create/Set variable');
            add('if', vscode.CompletionItemKind.Keyword, 'Conditional');
            add('else', vscode.CompletionItemKind.Keyword, 'Else block');
            add('while', vscode.CompletionItemKind.Keyword, 'Loop');
            add('func', vscode.CompletionItemKind.Keyword, 'Function');
            add('return', vscode.CompletionItemKind.Keyword, 'Return value');
            add('console.text', vscode.CompletionItemKind.Function, 'Print to console');
            add('readFile', vscode.CompletionItemKind.Function, 'Read from file');
            add('writeFile', vscode.CompletionItemKind.Function, 'Write to file');

            return items;
        }
    });

    context.subscriptions.push(completion);

    // --- HOVER DOCS ---
    const hover = vscode.languages.registerHoverProvider('fls', {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position);
            if (!range) return;

            const word = document.getText(range);

            const docs = {
                set: "Create/Sets a variable\n\nExample:\nset x = 10",
                if: "Runs code if condition is true",
                else: "Runs if previous condition is false",
                while: "Loops while condition is true",
                func: "Defines a function\n\nExample:\nfunc add(a, b)",
                return: "Returns a value from a function",
                console: "Console object",
                text: "Prints text to output",
                end: "Ends a block (if, while, func)",
                readFile: "Reads content from a file\n\nExample:\nreadFile('file.txt')",
                writeFile: "Writes content to a file\n\nExample:\nwriteFile('file.txt', 'Hello World')"
            };

            if (docs[word]) {
                return new vscode.Hover(docs[word]);
            }
        }
    });

    context.subscriptions.push(hover);
}

// --- AUTOCORRECT LOGIC ---
function getClosestKeyword(word, keywords) {
    let best = null;
    let bestScore = Infinity;

    for (const k of keywords) {
        const score = levenshtein(word, k);
        if (score < bestScore) {
            bestScore = score;
            best = k;
        }
    }

    return bestScore <= 2 ? best : null;
}

// --- LEVENSHTEIN DISTANCE ---
function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => []);

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }

    return dp[a.length][b.length];
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
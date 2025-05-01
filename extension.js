const vscode = require('vscode');
const path = require('path');

const MAX_MARKERS = 5;
const markers = Array(MAX_MARKERS + 1).fill(null);
const decorations = Array(MAX_MARKERS + 1).fill(null);

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    for (let i = 1; i <= MAX_MARKERS; i++) {
        const iconPath = context.asAbsolutePath(path.join('resources', `number-${i}-square.svg`));

        const setCmd = vscode.commands.registerCommand(`extension.setMarker${i}`, () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const position = editor.selection.active;
            const uri = editor.document.uri;
            markers[i] = new vscode.Location(uri, position);

            // Dispose previous decoration
            if (decorations[i]) decorations[i].dispose();

            decorations[i] = vscode.window.createTextEditorDecorationType({
                gutterIconPath: iconPath,
                gutterIconSize: 'contain',
            });

            const range = new vscode.Range(position.line, 0, position.line, 0);
            editor.setDecorations(decorations[i], [range]);
            vscode.window.showInformationMessage(`Marker ${i} set at line ${position.line + 1}`);
        });

        const gotoCmd = vscode.commands.registerCommand(`extension.gotoMarker${i}`, () => {
            const marker = markers[i];
            if (!marker) {
                vscode.window.showWarningMessage(`⚠️ Marker ${i} not set`);
                console.warn(`Attempted to go to marker ${i}, but it's not set`);
                return;
            }

            vscode.workspace.openTextDocument(marker.uri).then(doc => {
                vscode.window.showTextDocument(doc).then(editor => {
                    const pos = marker.range.start;
                    editor.selection = new vscode.Selection(pos, pos);
                    editor.revealRange(marker.range, vscode.TextEditorRevealType.InCenter);

                    vscode.window.showInformationMessage(`Jumped to Marker ${i} at line ${pos.line + 1}`);
                });
            });
        });

        context.subscriptions.push(setCmd, gotoCmd);
    }

    // Restore decorations on active tab switch
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) return;

        for (let i = 1; i <= MAX_MARKERS; i++) {
            const marker = markers[i];
            if (
                marker &&
                marker.uri.toString() === editor.document.uri.toString() &&
                decorations[i]
            ) {
                const range = new vscode.Range(marker.range.start.line, 0, marker.range.start.line, 0);
                editor.setDecorations(decorations[i], [range]);
            }
        }
    });

    // Optional: restore decorations when document is re-opened
    vscode.workspace.onDidOpenTextDocument(doc => {
        vscode.window.visibleTextEditors.forEach(editor => {
            if (editor.document.uri.toString() !== doc.uri.toString()) return;

            for (let i = 1; i <= MAX_MARKERS; i++) {
                const marker = markers[i];
                if (marker && marker.uri.toString() === doc.uri.toString() && decorations[i]) {
                    const range = new vscode.Range(marker.range.start.line, 0, marker.range.start.line, 0);
                    editor.setDecorations(decorations[i], [range]);
                }
            }
        });
    });
}

function deactivate() {
    decorations.forEach(d => d?.dispose());
}

module.exports = {
    activate,
    deactivate
};
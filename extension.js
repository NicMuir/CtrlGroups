const vscode = require('vscode');
const path = require('path');

const MAX_MARKERS = 9;
const markers = Array(MAX_MARKERS).fill(null);
const decorations = Array(MAX_MARKERS).fill(null);

/** @param {vscode.TextEditor} editor */
function restoreDecorations(editor) {
    const uri = editor.document.uri.toString();
    for (let i = 0; i < MAX_MARKERS; i++) {
        const marker = markers[i];
        if (marker && marker.uri.toString() === uri && decorations[i]) {
            const line = marker.range.start.line;
            const range = new vscode.Range(line, 0, line, 0);
            editor.setDecorations(decorations[i], [range]);
        }
    }
}

function activeCount() {
    return markers.filter(m => m !== null).length;
}

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusItem.command = 'extension.clearAllMarkers';
    context.subscriptions.push(statusItem);

    function updateStatus() {
        const count = activeCount();
        if (count === 0) {
            statusItem.hide();
        } else {
            statusItem.text = `$(bookmark) ${count}`;
            statusItem.tooltip = `${count} marker${count === 1 ? '' : 's'} set — click to clear all`;
            statusItem.show();
        }
    }

    for (let i = 0; i < MAX_MARKERS; i++) {
        const n = i + 1;
        const iconPath = context.asAbsolutePath(path.join('resources', `number-${n}-square.svg`));

        const setCmd = vscode.commands.registerCommand(`extension.setMarker${n}`, () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const position = editor.selection.active;
            const uri = editor.document.uri;

            if (markers[i] &&
                markers[i].uri.toString() === uri.toString() &&
                markers[i].range.start.line === position.line) {
                markers[i] = null;
                decorations[i]?.dispose();
                decorations[i] = null;
                vscode.window.showInformationMessage(`Marker ${n} removed from line ${position.line + 1}`);
                updateStatus();
                return;
            }

            markers[i] = new vscode.Location(uri, position);
            decorations[i]?.dispose();
            decorations[i] = vscode.window.createTextEditorDecorationType({
                gutterIconPath: iconPath,
                gutterIconSize: 'contain',
            });

            const range = new vscode.Range(position.line, 0, position.line, 0);
            editor.setDecorations(decorations[i], [range]);
            vscode.window.showInformationMessage(`Marker ${n} set at line ${position.line + 1}`);
            updateStatus();
        });

        const gotoCmd = vscode.commands.registerCommand(`extension.gotoMarker${n}`, () => {
            const marker = markers[i];
            if (!marker) {
                vscode.window.showWarningMessage(`Marker ${n} not set`);
                return;
            }

            vscode.workspace.openTextDocument(marker.uri).then(doc => {
                vscode.window.showTextDocument(doc).then(editor => {
                    const pos = marker.range.start;
                    editor.selection = new vscode.Selection(pos, pos);
                    editor.revealRange(marker.range, vscode.TextEditorRevealType.InCenter);
                });
            });
        });

        context.subscriptions.push(setCmd, gotoCmd);
    }

    const clearCmd = vscode.commands.registerCommand('extension.clearAllMarkers', () => {
        for (let i = 0; i < MAX_MARKERS; i++) {
            if (markers[i]) {
                markers[i] = null;
                decorations[i]?.dispose();
                decorations[i] = null;
            }
        }
        // Refresh all visible editors
        for (const editor of vscode.window.visibleTextEditors) {
            restoreDecorations(editor);
        }
        vscode.window.showInformationMessage('All markers cleared');
        updateStatus();
    });
    context.subscriptions.push(clearCmd);

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) restoreDecorations(editor);
    });

    vscode.workspace.onDidOpenTextDocument(doc => {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() === doc.uri.toString()) {
                restoreDecorations(editor);
            }
        }
    });
}

function deactivate() {
    decorations.forEach(d => d?.dispose());
}

module.exports = { activate, deactivate };

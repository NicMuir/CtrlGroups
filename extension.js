// Import required VS Code and Node.js modules
const vscode = require('vscode');
const path = require('path');

// Maximum number of markers that can be set
const MAX_MARKERS = 5;
// Array to store marker locations (index 0 unused, markers 1-5)
const markers = Array(MAX_MARKERS + 1).fill(null);
// Array to store decoration types for visual indicators
const decorations = Array(MAX_MARKERS + 1).fill(null);

/**
 * Main extension activation function
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function activate(context) {
    // Initialize markers 1 through MAX_MARKERS
    for (let i = 1; i <= MAX_MARKERS; i++) {
        // Get the path to the marker icon for this number
        const iconPath = context.asAbsolutePath(path.join('resources', `number-${i}-square.svg`));

        // Register command to set marker at current cursor position
        const setCmd = vscode.commands.registerCommand(`extension.setMarker${i}`, () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            // Store the current cursor position and document URI
            const position = editor.selection.active;
            const uri = editor.document.uri;

            // Check if there's already a marker at this position
            if (markers[i] && 
                markers[i].uri.toString() === uri.toString() && 
                markers[i].range.start.line === position.line) {
                // Remove the marker
                markers[i] = null;
                if (decorations[i]) {
                    decorations[i].dispose();
                    decorations[i] = null;
                }
                vscode.window.showInformationMessage(`Marker ${i} removed from line ${position.line + 1}`);
                return;
            }

            markers[i] = new vscode.Location(uri, position);

            console.log(markers)
            // Clean up previous decoration if it exists
            if (decorations[i]) decorations[i].dispose();

            // Create a new decoration type with the marker icon
            decorations[i] = vscode.window.createTextEditorDecorationType({
                gutterIconPath: iconPath,
                gutterIconSize: 'contain',
            });

            // Apply the decoration to the current line
            const range = new vscode.Range(position.line, 0, position.line, 0);
            editor.setDecorations(decorations[i], [range]);
            vscode.window.showInformationMessage(`Marker ${i} set at line ${position.line + 1}`);
        });

        // Register command to jump to a previously set marker
        const gotoCmd = vscode.commands.registerCommand(`extension.gotoMarker${i}`, () => {
            const marker = markers[i];
            if (!marker) {
                vscode.window.showWarningMessage(`⚠️ Marker ${i} not set`);
                console.warn(`Attempted to go to marker ${i}, but it's not set`);
                return;
            }

            // Open the document and navigate to the marker location
            vscode.workspace.openTextDocument(marker.uri).then(doc => {
                vscode.window.showTextDocument(doc).then(editor => {
                    const pos = marker.range.start;
                    // Set cursor position and scroll to the marker
                    editor.selection = new vscode.Selection(pos, pos);
                    editor.revealRange(marker.range, vscode.TextEditorRevealType.InCenter);

                    vscode.window.showInformationMessage(`Jumped to Marker ${i} at line ${pos.line + 1}`);
                });
            });
        });

        // Add both commands to the extension's subscriptions
        context.subscriptions.push(setCmd, gotoCmd);
    }

    // Restore marker decorations when switching between tabs
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) return;

        // Check each marker and restore its decoration if it's in the current document
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

    // Restore marker decorations when a document is reopened
    vscode.workspace.onDidOpenTextDocument(doc => {
        vscode.window.visibleTextEditors.forEach(editor => {
            if (editor.document.uri.toString() !== doc.uri.toString()) return;

            // Check each marker and restore its decoration if it's in the reopened document
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

// Clean up decorations when extension is deactivated
function deactivate() {
    decorations.forEach(d => d?.dispose());
}

// Export the extension's public interface
module.exports = {
    activate,
    deactivate
};
# ControlGroups

A lightweight Visual Studio Code extension for setting and jumping to numbered code anchors.

## Features

- **Set anchors** with `Ctrl+Shift+1` through `Ctrl+Shift+9`
- **Jump to anchors** with `Ctrl+1` through `Ctrl+9`
- **Toggle markers** — press the same set shortcut again on an already-marked line to remove it
- **Visual gutter icons** — colored numbered icons appear in the editor gutter for easy spotting
- **Status bar indicator** — shows how many markers are currently active; click to clear all
- **Clear all markers** via the Command Palette: `Clear All Markers`

## Commands

| Command | Title | Keybinding |
|---|---|---|
| `extension.setMarker1` | Set Marker 1 | `Ctrl+Shift+1` |
| `extension.gotoMarker1` | Goto Marker 1 | `Ctrl+1` |
| ... | ... | ... |
| `extension.setMarker9` | Set Marker 9 | `Ctrl+Shift+9` |
| `extension.gotoMarker9` | Goto Marker 9 | `Ctrl+9` |
| `extension.clearAllMarkers` | Clear All Markers | — |

## Requirements

- Visual Studio Code 1.96.0 or higher

## Known Issues

No known issues at this time.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[MIT](LICENSE)

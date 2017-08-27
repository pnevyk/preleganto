# Commands

Use following commands as `preleganto <command>`.

## Build

Build source file with content into HTML file. All **local files** are **embedded**,
however external resources are placed as links. This brings some limited
portability (**internet connection** is still **required**) but keeps compilation
process fast. In watch mode, the source file is watched for changes and
presentation is automatically **rebuilt on change**.

* `-i`, `--input` - Path to source file.
* `-o`, `--output` - Path where output file will be located.
* `-w`, `--watch` - Enables watch mode.

## Serve

Build source file with content into a temporary file and start local server with
WebSocket layer on specified port. The presentation can be then rendered on
**multiple devices** (actually, all devices in the same private network which
know server-device IP address). These devices are **synchronized** with each
other.

In watch mode, thes source file is watched for changes and presentation is
automatically rebuilt on change. Moreover, each connected client is then
**reloaded** so they display updated content of the presentation.

* `-i`, `--input` - Path to source file.
* `-p`, `--port` - Port on which local server is started.
* `-w`, `--watch` - Enables watch mode.

## Export

Build source file with content and embed all resources into output file. This
file requires **no internet connection** and is fully portable. At the moment,
only HTML format is supported, but in the future others may be implemented (PDF
has the highest priority).

* `-i`, `--input` - Path to source file.
* `-o`, `--output` - Path where output file will be located.
* `-f`, `--format` - Output format. Possible values: `html`

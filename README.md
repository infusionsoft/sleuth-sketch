# Sleuth for Sketch

Sleuth is an open source tool that shows you Sketch library usage per file across your projects.

This is great for getting an idea about how well your design system sketch ui kit is being used, though it's not perfect as using _any_ external library will generate a positive result on any layer or symbol.

Here's [a report built from the sample directory](https://infusionsoft.github.io/sleuth-sketch/)

### Currently, this tool looks at

- Symbols
- Layer styles
- Text styles

## Prerequisites

1. [Nodejs](https://nodejs.org) - This tool is built on Node.
2. [Sketch](https://sketch.com) - You need Sketch installed to process the files
3. [Abstract](https://abstract.com) (optional, but recommended) - If your team uses Abstract, you can automatically scan all of your team's projects. Make sure your Abstract projects are all synced before running.

... Or you can use [Figma](https://figma.com), but you still need Node.

## Getting started

1. [Download this repo](https://github.com/infusionsoft/sleuth-sketch/archive/master.zip) and extract it. (or fork it if you know what you're doing)
2. In Finder, locate where you extracted this repo
3. Right click on the folder
4. Select Services > New Terminal at Folder

The terminal window will open. This is where you will type any of the commands you need below.

## Install dependencies

``` bash
npm install
```

## Using Abstract

### Generate report from Abstract

``` bash
npm run report -- abstract
```

This will download all sketch files from all active projects to a temporary directory and scan them to build reports.

### Setting up Abstract

1. Open `EXAMPLE.env` in a code editor (we like [VSCode](https://code.visualstudio.com/))
2. Log into [abstract.com](https://abstract.com) from a web browser
3. Select the org you want from the dropdown
4. Copy the id from your address bar... `app.abstract.com/organizations/ [THIS IS YOUR ORG ID] /projects`
5. Paste it into `EXAMPLE.env`
6. Get an [Abstract API token](https://sdk.goabstract.com/docs/authentication/)
7. Paste it into `EXAMPLE.env` ** DO NOT PUBLISH YOUR API TOKEN TO A PUBLIC REPO**
8. Rename `EXAMPLE.env` to `.env`

## Using Figma

### Generate report from Figma

``` bash
npm run report -- figma
```

This will download all sketch files from all active projects to a temporary directory and scan them to build reports.

### Setting up Figma

1. Open `EXAMPLE.env` in a code editor (we like [VSCode](https://code.visualstudio.com/))
2. Log into [figma](https://figma.com) from a web browser
3. Select the team you want to track (you can track multiple, but start with one)
4. Copy the team id from your address bar... `.../team/ [THIS IS YOUR TEAM ID] /team-name`
5. Paste it into `EXAMPLE.env`
6. Repeat the process with each team you want to track, inserting a comma (,) between each ID - No spaces!
6. Get a Figma Personal Token from your user profile
7. Paste it into `EXAMPLE.env` ** DO NOT PUBLISH YOUR API TOKEN TO A PUBLIC REPO**
8. Rename `EXAMPLE.env` to `.env`

## Generate report from a directory

``` bash
npm run report -- ./sample #Replace ./sample with the directory of your sketch project files
```

Copy all the sketch files you want to scan into a directory with this folder structure. There is an example in this repo in `/sample`

```
Sketch project master folder
    |- PROJECT_NAME_1
    |   |- sketch_file1.sketch
    |   |- sketch_file2.sketch
    |- SECOND_PROJECT
        |- library.sketch
        |- second file.sketch
...
```

## Start a dev server to display the report

``` bash
npm run dev
```

## Build a Vue app with the report for distribution elsewhere

``` bash
npm run build
```

## Contributing

Please read our [Contribution Guidelines](https://github.com/infusionsoft/sleuth-sketch/blob/dev/.github/CODE_OF_CONDUCT.md) before making a pull request.

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Keap
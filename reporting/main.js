require('dotenv').config();

let rootProjectDirectory = process.argv[2];
if (!rootProjectDirectory || rootProjectDirectory === '--help' || rootProjectDirectory === '-h') {
    console.log('usage: npm run report -- [ root_project_directory | abstract ]');
    process.exit();
} else if (rootProjectDirectory === 'abstract') {
    rootProjectDirectory = "__TEMP";
}

const fs = require('fs');
const Abstract = require('abstract-sdk');
const del = require('del');
const path = require('path');
const analyzeSketch = require('./analyze-sketch');
const { lstatSync, readdirSync } = fs;
const { join } = path;

const startTime = Date.now();

function cleanFilePaths(string){
    return string.replace(/\//g,"-");
}

async function run(){
    // If we're using a temporary directory (for abstract), clear our project directory
    if (rootProjectDirectory === "__TEMP") {
        var fileCount = 0;
        if (!fs.existsSync(rootProjectDirectory)) {
            fs.mkdirSync(rootProjectDirectory);
        }
        del.sync([ rootProjectDirectory + '/**', '!' + rootProjectDirectory ],
        {
            //force: true,
        });

        // Download sketch files
        const apiClient = new Abstract.Client({
            accessToken: process.env.ABSTRACT_TOKEN,
            transportMode: ["api"]
        });
        const cliClient = new Abstract.Client({
            accessToken: process.env.ABSTRACT_TOKEN,
            transportMode: ["cli"]
        });
        const organizationId = process.env.ABSTRACT_ORG_ID;
        // Get projects
        const projects = await apiClient.projects.list({
            organizationId: organizationId,
        }, {filter: 'active'});

        const projectKeys = Object.keys(projects);
        let counter = 0;
        for (let pKey in projectKeys){
            // Each project get master branch files
            counter ++;
            const projectName = projects[projectKeys[pKey]].name;

            console.log("Getting project " + counter + " of " + projectKeys.length + " : " + projectName);
            const filesIdentifier = {
                projectId: projects[projectKeys[pKey]].id,
                branchId: "master",
                sha: "latest"
            }

            try{
                const files = await cliClient.files.list(filesIdentifier);

                fs.mkdirSync(rootProjectDirectory + '/' + cleanFilePaths(projects[projectKeys[pKey]].name));
                const fileKeys = Object.keys(files);
                for (let fKey in fileKeys ){

                    fileCount += 1;
                    // each file download it
                    const fileIdentifier = {
                        projectId: projects[projectKeys[pKey]].id,
                        branchId: "master",
                        fileId: files[fileKeys[fKey]].id,
                        sha: "latest",
                    };
                    const fileProps = {
                        filename: rootProjectDirectory + '/' + cleanFilePaths(projects[projectKeys[pKey]].name) + '/' + cleanFilePaths(files[fileKeys[fKey]].name+'.sketch'),
                    }

                    await cliClient.files.raw(fileIdentifier, fileProps);
                }
            } catch( error ) {
                console.log("--Project not synced. Skipping.");
            }
        }
        const downloadDoneTime = Date.now();
        const downloadTime = downloadDoneTime - startTime;
        console.log(`It took ${downloadTime / 1000} seconds to download all the files`);
        console.log(`That's ${(downloadTime / 1000) / fileCount} seconds per file on average`);
    }
}

function report(){
    // Start iterating through files
    const getDirectories = path => {
        return readdirSync(path).filter(filename => lstatSync(join(path, filename)).isDirectory());
    }

    const TARGET_FILE_EXTENSION = '.sketch';
    const RESULT_SAVE_DIRECTORY = join(__dirname, '../src/reports');
    if (!fs.existsSync(RESULT_SAVE_DIRECTORY)) {
        fs.mkdirSync(RESULT_SAVE_DIRECTORY);
    }

    const projectNames = getDirectories(rootProjectDirectory);
    const promises = [];
    const result = {
        timestamp: startTime,
        projects: {}
    };
    projectNames.forEach(projectName => {
        const projectPath = join(rootProjectDirectory, projectName);
        const targetFiles = readdirSync(projectPath).filter(filename => path.extname(filename).toLowerCase() === TARGET_FILE_EXTENSION);
        const projectResult = result.projects[projectName] = {};

        targetFiles.forEach(filename => {
            const filePath = join(projectPath, filename);
            const tidyFileName = filename.replace(/\s*\(.*\)\s*|\.sketch/g, '');

            promises.push(analyzeSketch({filePath: filePath, projectName: projectName, fileName: tidyFileName})
                .then(counts => {
                    projectResult[tidyFileName] = counts;
                    console.log(projectName + " > " + tidyFileName, counts);
                })
                .catch(error => {
                    console.log('error', error);
                })
            );
        });
    });

    Promise.all(promises).then(() => {
        const endTime = Date.now();
        const elapsed = endTime - startTime;

        // Let's do a bit of post processing to link our symbol ID's together.

        // Merge all the symbols and styles together into one object.
        var allSymbols = {};
        var allTextStyles = {};
        var allLayerStyles = {};

        for (project in result.projects) {
            const thisProject = result.projects[project];

            for (file in thisProject) {
                const thisFile = thisProject[file];
                allSymbols = Object.assign(allSymbols, thisFile.shareables.symbols);
                allTextStyles = Object.assign(allTextStyles, thisFile.shareables.textStyles);
                allLayerStyles = Object.assign(allLayerStyles, thisFile.shareables.layerStyles);
            }
        }
        result.allSymbols = allSymbols;
        result.allTextStyles = allTextStyles;
        result.allLayerStyles = allLayerStyles;

        // Now let's count the instances of symbols and distribute those counts around where they make sense.
        for (project in result.projects) {
            const thisProject = result.projects[project];

            for (file in thisProject) {
                const thisFile = thisProject[file];
                for (symbol in thisFile.counts.externalSymbols) {
                    symbolCount = thisFile.counts.externalSymbols[symbol];
                    if (typeof result.allSymbols[symbol].count !== "undefined")
                    {
                        result.allSymbols[symbol].count += symbolCount;
                    } else {
                        result.allSymbols[symbol].count = symbolCount;
                    }
                }
                for (style in thisFile.counts.externalTextStyles) {
                    styleCount = thisFile.counts.externalTextStyles[style];
                    if (typeof result.allTextStyles[style].count !== "undefined")
                    {
                        result.allTextStyles[style].count += styleCount;
                    } else {
                        result.allTextStyles[style].count = styleCount;
                    }
                }
                for (style in thisFile.counts.externalLayerStyles) {
                    styleCount = thisFile.counts.externalLayerStyles[style];
                    if (typeof result.allLayerStyles[style].count !== "undefined")
                    {
                        result.allLayerStyles[style].count += styleCount;
                    } else {
                        result.allLayerStyles[style].count = styleCount;
                    }
                }
            }
        }

        fs.writeFileSync(
            `${RESULT_SAVE_DIRECTORY}/${endTime}.json`,
            JSON.stringify(result, null, 4)
        );

        console.log(`It took ${elapsed / 1000} seconds to finish.`);
        console.log(`You should run "npm run dev" or "npm run build" to see your report.`);
    }).catch(error => {
        console.log('Error writing report to file', error);
    });
}

run().then(function(){
    report();
}).then(function(){
    if (rootProjectDirectory === '__TEMP') {
        del.sync([ rootProjectDirectory + '/**']);
    }
}).catch(function(e){
    console.log(e);
});
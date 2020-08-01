const ns = require('node-sketch');

let externalSymbolIds;
let externalTextStyleIds;
let externalLayerStyleIds;
let externalStyleLinks;

const countLayers = (node, counts) => {
    if (node.layers) {
        node.layers.forEach((layerNode) => {
            countLayers(layerNode, counts);
        });
    } else {
        counts.layers++;
    }

    if (node.symbolID && externalSymbolIds.has(node.symbolID)) {
        counts.layersReferencingExternalSymbols++;
        const thisMasterID = node.symbolMaster.parent.originalMaster.symbolID; // Sketch stores a different symbol id to match to the master symbol ID.
        if (typeof counts.externalSymbols[thisMasterID] === "undefined") {
            counts.externalSymbols[thisMasterID]=1;
        }
        else{
            counts.externalSymbols[thisMasterID]++;
        }
        counts.layersReferencingExternalAnyStyles++;
    }
    if (node.sharedStyleID && externalLayerStyleIds.has(node.sharedStyleID)) {
        counts.layersReferencingExternalLayerStyles++;
        const thisMasterID = externalStyleLinks[node.sharedStyleID]
        if (typeof counts.externalLayerStyles[thisMasterID] === "undefined") {
            counts.externalLayerStyles[thisMasterID]=1;
        }
        else{
            counts.externalLayerStyles[thisMasterID]++;
        }
        counts.layersReferencingExternalAnyStyles++;
    }

    if (node.sharedStyleID && externalTextStyleIds.has(node.sharedStyleID)) {
        counts.layersReferencingExternalTextStyles++;
        const thisMasterID = externalStyleLinks[node.sharedStyleID]
        if (typeof counts.externalLayerStyles[thisMasterID] === "undefined") {
            counts.externalTextStyles[thisMasterID]=1;
        }
        else{
            counts.externalTextStyles[thisMasterID]++;
        }
        counts.layersReferencingExternalAnyStyles++;
    }

    return counts;
};

module.exports = async params => {
    const sketch = await ns.read(params.filePath);
    const pages = [...sketch.pages, sketch.symbolsPage];
    externalSymbolIds = new Set(sketch.foreignSymbols.map((item) => item.symbolID));
    externalTextStyleIds = new Set(sketch.foreignTextStyles.map((item) => item.do_objectID));
    externalLayerStyleIds = new Set(sketch.foreignLayerStyles.map((item) => item.do_objectID));
    externalStyleLinks = {};
    const counts = {
        layers: 0,
        layersReferencingExternalSymbols: 0,
        layersReferencingExternalLayerStyles: 0,
        layersReferencingExternalTextStyles: 0,
        layersReferencingExternalAnyStyles: 0,
        externalSymbols: {},
        externalTextStyles: {},
        externalLayerStyles: {},
    };

    const shareables = {
        symbols: {},
        textStyles: {},
        layerStyles: {},
    }

    //Create our external style links
    for (style in sketch.foreignTextStyles) {
        thisStyle = sketch.foreignTextStyles[style];

        if (typeof thisStyle.parent !== "undefined") {
            externalStyleLinks[thisStyle.do_objectID] = thisStyle.parent.remoteStyleID;
        }
    }
    for (style in sketch.foreignLayerStyles) {
        thisStyle = sketch.foreignLayerStyles[style];

        if (typeof thisStyle.parent !== "undefined") {
            externalStyleLinks[thisStyle.do_objectID] = thisStyle.parent.remoteStyleID;
        }
    }

    // Map symbol data to our shareables object
    sketch.symbols.forEach(function(symbol) {
        shareables.symbols[symbol.symbolID] = {
            name: symbol.name,
            id: symbol.symbolID,
            sourceProject: params.projectName,
            sourceFile: params.fileName,
        }
    });
    // Map text style data to our shareables object
    sketch.textStyles.forEach(function(style) {
        shareables.textStyles[style.do_objectID] = {
            name: style.name,
            id: style.do_objectID,
            sourceProject: params.projectName,
            sourceFile: params.fileName,
        }
    });
    // Map layer styles data to our shareables object
    sketch.layerStyles.forEach(function(style) {
        shareables.layerStyles[style.do_objectID] = {
            name: style.name,
            id: style.do_objectID,
            sourceProject: params.projectName,
            sourceFile: params.fileName,
        }
    });


    var haveCheckedSymbolsPage = false;
    pages.forEach(page => {
        if (page && (page != sketch.symbolsPage || !haveCheckedSymbolsPage)) {
            countLayers(page, counts);
        }
        if (page == sketch.symbolsPage) {
            haveCheckedSymbolsPage = true;
        }
    });

    return {counts, shareables, projectName: params.projectName, fileName: params.fileName};
};

const Figma = require('figma-api');

const figma = new Figma.Api({
    personalAccessToken: process.env.FIGMA_TOKEN,
});

let externalSymbolIds;
let externalTextStyleIds;
let externalLayerStyleIds;
let externalStyleLinks;

const countLayers = (node, counts) => {
    if (node.children && node.type != "INSTANCE") { // Stop traversing the tree when we've got a component instance
        node.children.forEach((layerNode) => {
            countLayers(layerNode, counts);
        });
    }

    if (node.type != "GROUP"  && node.type != "DOCUMENT" && node.type != "PAGE") {
        counts.layers++;

        if (node.type == "INSTANCE" && externalSymbolIds.has(node.componentId)) {
            counts.layersReferencingExternalSymbols++;
            if (typeof counts.externalSymbols[node.componentId] === "undefined") {
                counts.externalSymbols[node.componentId]=1;
            }
            else{
                counts.externalSymbols[node.componentId]++;
            }
            counts.layersReferencingExternalAnyStyles++;
        }
        else if (node.styles) {
            var textGood = false;
            var colorGood = false;
            for (style in node.styles)
            {
                thisStyle = node.styles[style];
                if (externalTextStyleIds.has(thisStyle)) {
                    textGood = true;
                    if (typeof counts.externalTextStyles[thisStyle] === "undefined") {
                        counts.externalTextStyles[thisStyle]=1;
                    }
                    else {
                        counts.externalTextStyles[thisStyle]++;
                    }
                }
                if (externalLayerStyleIds.has(thisStyle)) {
                    colorGood = true;
                    if (node.type != "TEXT") {
                        textGood = true;
                    }
                    if (typeof counts.externalLayerStyles[thisStyle] === "undefined") {
                        counts.externalLayerStyles[thisStyle]=1;
                    }
                    else {
                        counts.externalLayerStyles[thisStyle]++;
                    }
                }
            }
            if (textGood && colorGood)
            {
                if (node.type=="TEXT") {
                    counts.layersReferencingExternalTextStyles++;
                }
                else {
                    counts.layersReferencingExternalLayerStyles++;
                }
                counts.layersReferencingExternalAnyStyles++;
            }
        }
    }
    return counts;
};

module.exports = async params => {
    const file = await figma.getFile(params.fileKey);
    const pages = [...file.document.children];

    externalSymbolIds = new Set(Object.keys(file.components).map((key) => file.components[key].key != "" ? key  : null )); // This doesn't work because components is an object, not an array.
    externalTextStyleIds = new Set(Object.keys(file.styles).map((key) => file.styles[key].styleType == "TEXT" ? key : null ));
    externalLayerStyleIds = new Set(Object.keys(file.styles).map((key) => file.styles[key].styleType != "TEXT" ? key : null ));
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
    for (style in file.styles) {
        thisStyle = file.styles[style];

        if (thisStyle.key != "") {
            externalStyleLinks[style] = thisStyle.key;
        }
    }

    // Map symbol data to our shareables object
    /*
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
    */

    pages.forEach(page => {
        if (page) {
            countLayers(page, counts);
        }
    });
    const returnThis = {
        counts,
        shareables,
        fileName: params.fileName,
        projectName: params.projectName,
    }
    return returnThis;
};

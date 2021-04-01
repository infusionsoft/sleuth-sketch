const Figma = require('figma-api');

const figma = new Figma.Api({
    personalAccessToken: process.env.FIGMA_TOKEN,
});

let externalSymbolIds;
let externalTextStyleIds;
let externalLayerStyleIds;
let externalStyleLinks;

const countLayers = (node, counts) => {
    if (node.children && node.type != "INSTANCE" && node.type != "BOOLEAN_OPERATION") { // Stop traversing the tree when we've got a component instance
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
    let pages = [];
    let brokenFile = false;
    const file = await figma.getFile(params.fileKey);
    if (typeof(file.document) == "undefined"){
        console.log("Broken file!");
        console.log(file);
        brokenFile = true;
    }
    if (!brokenFile){
        pages = [...file.document.children];
        externalSymbolIds = new Set(Object.keys(file.components).map((key) => file.components[key].key != "" ? key  : null )); // This doesn't work because components is an object, not an array.
        externalTextStyleIds = new Set(Object.keys(file.styles).map((key) => file.styles[key].styleType == "TEXT" ? key : null ));
        externalLayerStyleIds = new Set(Object.keys(file.styles).map((key) => file.styles[key].styleType != "TEXT" ? key : null ));
        externalStyleLinks = {};
    }
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

    if(!brokenFile){
        //Create our external style links
        for (style in file.styles) {
            thisStyle = file.styles[style];

            if (thisStyle.key != "") {
                externalStyleLinks[style] = thisStyle.key;
            }
        }

        pages.forEach(page => {
            if (page) {
                countLayers(page, counts);
            }
        });
    }
    const returnThis = {
        counts,
        shareables,
        fileName: params.fileName,
        projectName: params.projectName,
    }
    return returnThis;
};

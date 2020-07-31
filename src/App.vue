<template lang="html">
    <div class="content">
        <modal
            ref="fileBreakdownModal"
            title="File breakdown"
            size="xl"
            show-close
        >
            <file-breakdown-table :data="selectedProjectFileData" />
        </modal>

        <h2>Sketch Library Coverage</h2>
        <p class="description">A breakdown of how the external libraries (symbols, layer and type styles) are used in sketch files</p>

        <h3>Overall coverage across all tracked files</h3>
        <div class="metrics">
            <dl class="metric">
                <dd>{{ totalCoverage }}%</dd>
                <dt>{{ totalLayersReferencingExternalAny }} of {{ totalLayers }} layers use external libraries</dt>
            </dl>
            <dl class="metric">
                <dd>{{ projectWithMost.coverage }}%</dd>
                <dt>The {{ projectWithMost.projectName }} project has the most coverage</dt>
            </dl>
            <dl class="metric">
                <dd>{{ projectWithLeast.coverage }}%</dd>
                <dt>The {{ projectWithLeast.projectName }} project has the least coverage</dt>
            </dl>
        </div>

        <h3>By project</h3><br/>
        <table-grid
            ref="table"
            :data="rows"
            :sort-field="sortField"
            :sort-ascending="sortAscending"
            :click-row="showFileBreakdownModal"
            @sort="sort"
        >
            <table-grid-column
                label="Project"
                prop="projectName"
                sortable
            />

            <table-grid-column
                label="Updated"
                prop="updateTime"
                width="50"
                sortable
                numeric
            >
                <span slot-scope="props">
                    {{ props.updateTime ? new Date(props.updateTime).toLocaleDateString('en-US') : '---' }}
                </span>
            </table-grid-column>

            <table-grid-column
                label="Files"
                prop="fileCount"
                width="50"
                sortable
                numeric
            />

            <table-grid-column
                label="Layers"
                prop="layerCount"
                width="50"
                sortable
                numeric
            >
                <span slot-scope="props">
                    {{ numberWithCommas(props.layerCount) }}
                </span>
            </table-grid-column>

            <table-grid-column
                label="Lib Symbols"
                prop="layersReferencingExternalSymbols"
                width="50"
                sortable
                numeric
            >
                <span slot-scope="props">
                    {{ numberWithCommas(props.layersReferencingExternalSymbols) }}
                </span>
            </table-grid-column>

             <table-grid-column
                label="Lib Colors"
                prop="layersReferencingExternalLayerStyles"
                width="50"
                sortable
                numeric
            >
                <span slot-scope="props">
                    {{ numberWithCommas(props.layersReferencingExternalLayerStyles) }}
                </span>
            </table-grid-column>

             <table-grid-column
                label="Lib Type"
                prop="layersReferencingExternalTextStyles"
                width="50"
                sortable
                numeric
            >
                <span slot-scope="props">
                    {{ numberWithCommas(props.layersReferencingExternalTextStyles) }}
                </span>
            </table-grid-column>

            <table-grid-column
                label="Coverage"
                prop="coverage"
                sortable
                numeric
                width="50"
            >
                <span slot-scope="props">{{ props.coverage }}%</span>
            </table-grid-column>
        </table-grid>
        <div class="footer">
            <p>This report was generated using <a href="https://github.com/infusionsoft/sleuth-sketch">Sleuth for Sketch</a> by <a href="https://keap.com">Keap</a>.</p>
        </div>
    </div>
</template>

<script>
import FileBreakdownTable from '@/components/FileBreakdownTable';
import TableGrid from '@/components/TableGrid/TableGrid';
import TableGridColumn from '@/components/TableGrid/TableGridColumn';
import Modal from '@/components/Modal';

const importAllReports = path => {
    const context = require.context(".", true, /\.json$/);
    const result = {};
    context.keys().forEach(key => {
        const report = context(key);
        result[report.timestamp] = report;
    });
    return result;
};

const reports = importAllReports('/reports/');

export default {
    name: 'App',

    components: {
        FileBreakdownTable,
        Modal,
        TableGrid,
        TableGridColumn
    },

    data() {
        return {
            sortField: 'updateTime',
            sortAscending: false,
            rows: [],
            totalLayers: 0,
            totalLayersReferencingExternalAny: 0,
            projectWithMost: null,
            projectWithLeast: null,
            selectedProjectFileData: [],
        };
    },

    created() {
        let rowData = {};
        let latestTimeStamp = 0;
        Object.keys(reports).forEach(timestamp => {
            const report = reports[timestamp];
            if (parseInt(timestamp, 10) > latestTimeStamp) {
                // If we found a newer report, replace the row data.
                // This effectively hides historical data from the table.
                rowData = {};
                latestTimeStamp = parseInt(timestamp, 10);

                Object.keys(report.projects).forEach(projectName => {
                    const project = report.projects[projectName];
                    const projectRow = rowData[projectName] || {};
                    if (!projectRow.updateTime || timestamp > projectRow.updateTime) {
                        const filenames = Object.keys(project);
                        const fileData = filenames.map(filename => {
                            const result = {
                                filename,
                                ...project[filename],
                                coverage: 0,
                            };
                            if (typeof result.counts === "undefined") // For legacy reports
                            {
                                result.counts = {
                                    ...project[filename]
                                }
                            }
                            if (result.counts.layers > 0) {
                                result.coverage = (result.counts.layersReferencingExternalSymbols + result.counts.layersReferencingExternalLayerStyles + result.counts.layersReferencingExternalTextStyles) / result.counts.layers;
                                result.coverage = parseFloat((result.coverage * 100).toFixed(1));
                            }

                            return result;
                        });

                        projectRow.fileData = fileData;
                        projectRow.projectName = projectName;
                        projectRow.updateTime = parseInt(timestamp);
                        projectRow.fileCount = filenames.length;

                        projectRow.layerCount = 0;
                        projectRow.layersReferencingExternalSymbols = 0;
                        projectRow.layersReferencingExternalLayerStyles = 0;
                        projectRow.layersReferencingExternalTextStyles = 0;
                        projectRow.layersReferencingExternalAny = 0;

                        fileData.forEach(file => {
                            projectRow.layerCount += file.counts.layers;
                            projectRow.layersReferencingExternalSymbols += file.counts.layersReferencingExternalSymbols;
                            projectRow.layersReferencingExternalLayerStyles += file.counts.layersReferencingExternalLayerStyles;
                            projectRow.layersReferencingExternalTextStyles += file.counts.layersReferencingExternalTextStyles;
                            projectRow.layersReferencingExternalAny += file.counts.layersReferencingExternalTextStyles + file.counts.layersReferencingExternalLayerStyles + file.counts.layersReferencingExternalSymbols;
                        });

                        if (projectRow.layerCount > 0) {
                            projectRow.coverage = projectRow.layersReferencingExternalAny / projectRow.layerCount;
                        } else {
                            projectRow.coverage = 0;
                        }
                        projectRow.coverage = parseFloat((projectRow.coverage * 100).toFixed(1));
                    }
                    rowData[projectName] = projectRow;
                });
            }
        });

        this.rows = Object.values(rowData);
        this.calcMetrics(this.rows);
    },

    mounted() {
        this.sort({ field: this.sortField, ascending: this.sortAscending });
    },

    computed: {
        totalCoverage() {
            return (100 * this.totalLayersReferencingExternalAny / this.totalLayers).toFixed(2);
        }
    },

    methods: {
        calcMetrics(rows) {
            this.totalLayers = 0;
            this.totalLayersReferencingExternalAny = 0;

            rows.forEach(row => {
                if (!this.projectWithMost || row.coverage > this.projectWithMost.coverage) {
                    this.projectWithMost = row;
                }

                if (!this.projectWithLeast || row.coverage < this.projectWithLeast.coverage) {
                    this.projectWithLeast = row;
                } else if (row.coverage === this.projectWithLeast.coverage && row.layerCount > this.projectWithLeast.layerCount) {
                    this.projectWithLeast = row;
                }

                this.totalLayers += row.layerCount;
                this.totalLayersReferencingExternalAny += row.layersReferencingExternalAny;
            });
        },

        sort({ field, ascending }) {
            this.sortField = field;
            this.sortAscending = ascending;

            this.rows.sort((a, b) => ascending ? this.compare(a, b, field) : this.compare(b, a, field));
        },

        compare(a, b, field) {
            return (a[field] < b[field]) ? -1 : (a[field] > b[field]) ? 1 : 0;
        },

        numberWithCommas(x) {
            if (typeof x !== 'number') {
                return '';
            }

            const parts = x.toString().split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        },

        showFileBreakdownModal(row) {
            this.selectedProjectFileData = row.fileData;
            this.$refs.fileBreakdownModal.toggleable_open();
        },
    },
};
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
    @import "@/styles/main.scss";
    .content {
        padding: $gp px-to-rem(24px);
        max-width: px-to-rem(1280px);
        margin: 0 auto;
        @media($small) {
            padding: $gp;
        }
    }

    .description {
        color: $color-gray-dark;
        font-size: $font-size-md;
    }

    .metrics {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        margin-bottom: $gp;
        flex-wrap: wrap;

        dl {
            display: flex;
            align-items: space-between;
            min-width: px-to-rem(320px);
            width: 33.3%;
            dd {
                font-size: $font-size-mega;
                font-weight: $font-weight-light;
                color: $color-navy;
                margin: 0;
            }

            dt {
                font-size: $font-size-md;
                margin: $gp / 2 $gp * 2 0 $gp;
            }
        }
    }
    .footer {
        padding: $gp * 2;
        p {
            font-size: $font-size-xsmall;
            color: $color-gray-dark;
            text-align: center;
        }
    }
</style>

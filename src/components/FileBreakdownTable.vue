<template lang="html">
    <table-grid
        ref="table"
        :data="data"
        :sort-field="sortField"
        :sort-ascending="sortAscending"
        @sort="sort"
    >
        <table-grid-column
            label="File"
            prop="filename"
            sortable
        />

        <table-grid-column
            label="Layers"
            width="50"
            sortable
            numeric
        >
            <span slot-scope="props">{{ props.counts.layers }}</span>
        </table-grid-column>

        <table-grid-column
            label="Lib Symbols"
            width="50"
            sortable
            numeric
        >
            <span slot-scope="props">{{ props.counts.layersReferencingExternalSymbols }}</span>
        </table-grid-column>

        <table-grid-column
            label="Lib Colors"
            width="50"
            sortable
            numeric
        >
            <span slot-scope="props">{{ props.counts.layersReferencingExternalLayerStyles }}</span>
        </table-grid-column>
        <table-grid-column
            label="Lib Type"
            width="50"
            sortable
            numeric
        >
            <span slot-scope="props">{{ props.counts.layersReferencingExternalTextStyles }}</span>
        </table-grid-column>
        <table-grid-column
            label="Coverage"
            prop="coverage"
            sortable
            numeric
        >
            <span slot-scope="props">{{ props.coverage }}%</span>
        </table-grid-column>
    </table-grid>
</template>

<script>
import TableGrid from '@/components/TableGrid/TableGrid';
import TableGridColumn from '@/components/TableGrid/TableGridColumn';

export default {
    name: 'FileBreakdownTable',

    components: {
        TableGrid,
        TableGridColumn,
    },

    props: {
        data: Array,
    },

    data() {
        return {
            sortField: 'filename',
            sortAscending: true,
        };
    },

    methods: {
        sort({ field, ascending }) {
            this.sortField = field;
            this.sortAscending = ascending;

            this.data.sort((a, b) => ascending ? this.compare(a, b, field) : this.compare(b, a, field));
        },

        compare(a, b, field) {
            return (a[field] < b[field]) ? -1 : (a[field] > b[field]) ? 1 : 0;
        },
    },
};
</script>

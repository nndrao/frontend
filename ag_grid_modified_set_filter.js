// Helper function to get historical values for a column
function getHistoricalValues(colId) {
    const stored = localStorage.getItem(`historical_values_${colId}`);
    return stored ? JSON.parse(stored) : [];
}

// Helper function to save historical values
function saveHistoricalValues(colId, values) {
    const existing = new Set(getHistoricalValues(colId));
    values.forEach(val => existing.add(val));
    localStorage.setItem(`historical_values_${colId}`, JSON.stringify([...existing]));
}

// Helper function to get current unique values from data
function getCurrentValues(api, colId) {
    const values = new Set();
    api.forEachNode((node) => {
        if (node.data && node.data[colId] != null) {
            values.add(node.data[colId]);
        }
    });
    return [...values];
}

const gridOptions = {
    columnDefs: [
        {
            field: 'category',
            filter: 'agSetColumnFilter',
            filterParams: {
                values: (params) => {
                    // Get current values from dataset
                    const currentValues = getCurrentValues(params.api, 'category');
                    
                    // Get historical values from localStorage
                    const historicalValues = getHistoricalValues('category');
                    
                    // Combine and deduplicate
                    const allValues = [...new Set([...currentValues, ...historicalValues])];
                    
                    // Sort the values
                    return allValues.sort();
                },
                // Refresh values when data changes
                refreshValuesOnOpen: true
            }
        },
        // ... other columns
    ],
    
    rowData: [], // Your data here
    
    onGridReady: (params) => {
        // Load saved filter state
        const savedState = localStorage.getItem('ag_grid_filter_state');
        if (savedState) {
            const filterModel = JSON.parse(savedState);
            
            // Before applying filter, save any filtered values as historical
            Object.keys(filterModel).forEach(colId => {
                const filter = filterModel[colId];
                if (filter.filterType === 'set' && filter.values) {
                    saveHistoricalValues(colId, filter.values);
                }
            });
            
            params.api.setFilterModel(filterModel);
        }
    },
    
    onFilterChanged: (params) => {
        // Save filter state and update historical values
        const filterModel = params.api.getFilterModel();
        
        // Save historical values for each set filter
        Object.keys(filterModel).forEach(colId => {
            const filter = filterModel[colId];
            if (filter.filterType === 'set' && filter.values) {
                saveHistoricalValues(colId, filter.values);
            }
        });
        
        // Save filter state
        localStorage.setItem('ag_grid_filter_state', JSON.stringify(filterModel));
    },
    
    // Optional: Refresh filter values when data changes
    onRowDataUpdated: (params) => {
        // Force refresh of set filter values
        params.api.getColumns().forEach(column => {
            const filter = params.api.getFilterInstance(column.getColId());
            if (filter && filter.refreshFilterValues) {
                filter.refreshFilterValues();
            }
        });
    }
};

// Initialize grid
const eGridDiv = document.querySelector('#myGrid');
new agGrid.Grid(eGridDiv, gridOptions);

// Function to manually add historical values (call this when you know certain values should be preserved)
function addToHistoricalValues(colId, values) {
    saveHistoricalValues(colId, Array.isArray(values) ? values : [values]);
    
    // Refresh the specific filter
    const filterInstance = gridOptions.api.getFilterInstance(colId);
    if (filterInstance && filterInstance.refreshFilterValues) {
        filterInstance.refreshFilterValues();
    }
}

// Example usage:
// addToHistoricalValues('category', ['Old Category That No Longer Exists']);

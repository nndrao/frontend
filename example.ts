import { 
  GridOptions, 
  NavigateToNextCellParams, 
  CellPosition, 
  GridApi, 
  GridReadyEvent
} from 'ag-grid-community';

const gridOptions: GridOptions = {
  // Your other grid options
  
  navigateToNextCell: function(params: NavigateToNextCellParams): CellPosition | null {
    const previousCell: CellPosition = params.previousCellPosition;
    const suggestedNextCell: CellPosition = params.nextCellPosition;
    
    // No key checking - apply delay to all keyboard navigation
    if (suggestedNextCell !== null) {
      // Store reference to API and the target position
      const api: GridApi = params.api;
      const targetRowIndex: number = suggestedNextCell.rowIndex;
      const targetColumn = suggestedNextCell.column;
      
      // Return null initially to prevent immediate navigation
      setTimeout(function() {
        // Check if column still exists (in case of resize/remove)
        const columnDefs = api.getColumnDefs();
        const columnStillExists = columnDefs ? columnDefs.some(
          col => col.field === targetColumn.getColDef().field
        ) : false;
        
        if (columnStillExists && targetRowIndex < api.getDisplayedRowCount() && targetRowIndex >= 0) {
          // After 100ms delay, manually navigate to the next cell
          api.forceNavigateTo({
            rowIndex: targetRowIndex,
            column: targetColumn
          });
        }
      }, 100);
      
      return null; // Prevents default navigation
    }
    
    return suggestedNextCell;
  },
  
  // Add event listeners for column changes
  onGridReady: function(params: GridReadyEvent): void {
    params.api.addEventListener('columnResized', function() {
      // Allow a small delay for the grid to stabilize after resize
      setTimeout(function() {
        params.api.refreshCells({ force: true });
      }, 50);
    });
    
    // Optional: Also handle column visibility changes
    params.api.addEventListener('columnVisible', function() {
      setTimeout(function() {
        params.api.refreshCells({ force: true });
      }, 50);
    });
  }
};

export default gridOptions;

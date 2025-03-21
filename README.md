navigateToNextCell: function(params) {
    const previousCell = params.previousCellPosition;
    const suggestedNextCell = params.nextCellPosition;
    
    // Check if the navigation is triggered by any arrow key
    if (['ArrowDown', 'Down', 'ArrowUp', 'Up', 'ArrowLeft', 'Left', 'ArrowRight', 'Right'].includes(params.key)) {
      // Store reference to API and the target position
      const api = params.api;
      const targetRowIndex = suggestedNextCell.rowIndex;
      const targetColumn = suggestedNextCell.column;
      
      // Return null initially to prevent immediate navigation
      setTimeout(function() {
        // Check if column still exists (in case of resize/remove)
        const columnStillExists = api.getColumnDefs().some(
          col => col.field === targetColumn.getColDef().field
        );
        
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
    
    // For other keys, use default behavior
    return suggestedNextCell;
  }

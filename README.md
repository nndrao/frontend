 navigateToNextCell: function(params) {
    const previousCell = params.previousCellPosition;
    const suggestedNextCell = params.nextCellPosition;
    
    // Example condition: Clear focus when navigating beyond the last column
    if (suggestedNextCell && 
        previousCell.column.getColId() === 'lastColumnId' && 
        params.key === 'ArrowRight') {
      // Return null to clear focus
      return null;
    }
    
    // Example condition: Clear focus when navigating down from the last row
    if (previousCell.rowIndex === (gridOptions.rowData.length - 1) && 
        params.key === 'ArrowDown') {
      return null;
    }
    
    // Otherwise proceed with default navigation
    return suggestedNextCell;
  }
};

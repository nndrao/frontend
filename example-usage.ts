// Example usage in Angular component
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { GridReadyEvent, GridApi } from 'ag-grid-community';
import { GridWrapper } from './grid-wrapper';

@Component({
  selector: 'app-data-grid',
  template: `
    <div class="ag-theme-alpine" style="height: 500px;">
      <ag-grid-angular
        style="width: 100%; height: 100%;"
        [rowData]="rowData"
        [columnDefs]="columnDefs"
        [pagination]="true"
        (gridReady)="onGridReady($event)"
      >
      </ag-grid-angular>
    </div>
  `
})
export class DataGridComponent implements OnInit, OnDestroy {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  
  // Data and column definitions
  columnDefs = [
    { field: 'make' },
    { field: 'model' },
    { field: 'price' }
  ];

  rowData = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxster', price: 72000 }
  ];

  private gridApi: GridApi | null = null;
  private cleanupFunction: (() => void) | null = null;
  
  constructor() {}
  
  ngOnInit(): void {}
  
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    
    // Simply attach the enhanced navigation to the grid
    this.cleanupFunction = GridWrapper.enhanceGridNavigation(this.gridApi, {
      // Optional custom configuration
      initialDelay: 250,
      eventsPerSecond: 10
    });
    
    // Initial data loading or other grid setup
    this.gridApi.sizeColumnsToFit();
  }
  
  ngOnDestroy(): void {
    // Clean up navigation enhancement when component is destroyed
    if (this.cleanupFunction) {
      this.cleanupFunction();
    }
    
    // Or use the class method
    if (this.gridApi) {
      GridWrapper.disableGridNavigation(this.gridApi);
    }
  }
}

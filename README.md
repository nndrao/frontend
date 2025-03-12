For ag-Grid version 32 and above, the floating filter API has changed somewhat. Here's an updated implementation that will work with newer versions of ag-Grid:

```typescript
import { Component } from '@angular/core';
import { IFloatingFilter, IFloatingFilterParams, FilterChangedEvent } from 'ag-grid-community';

@Component({
  selector: 'custom-text-floating-filter',
  template: `
    <div class="ag-floating-filter-input" style="position: relative;">
      <input 
        #input
        [value]="currentValue"
        (input)="onInputChanged($event)"
        class="ag-floating-filter-full-width" 
        type="text"
        placeholder="Filter..."
      />
      <button 
        *ngIf="currentValue" 
        class="clear-button" 
        (click)="clearFilter()"
        style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); 
              background: none; border: none; cursor: pointer; padding: 0 5px;"
      >
        ✕
      </button>
    </div>
  `,
  styles: [`
    .clear-button:hover {
      color: #666;
    }
  `]
})
export class CustomTextFloatingFilterComponent implements IFloatingFilter {
  params: IFloatingFilterParams;
  currentValue: string = '';

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
  }

  onParentModelChanged(parentModel: any): void {
    if (!parentModel) {
      this.currentValue = '';
    } else {
      this.currentValue = parentModel.filter || '';
    }
  }

  onInputChanged(event: any): void {
    this.currentValue = event.target.value;
    this.applyFilter();
  }

  clearFilter(): void {
    this.currentValue = '';
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.params.parentFilterInstance) {
      const filterInstance = this.params.parentFilterInstance();
      
      if (this.currentValue) {
        // For ag-Grid v32+, use the new API methods
        filterInstance.setModel({
          filterType: 'text',
          type: 'contains',
          filter: this.currentValue
        });
      } else {
        filterInstance.setModel(null);
      }
      
      // Use newer filter API to notify about filter change
      const event: FilterChangedEvent = {
        api: this.params.api,
        columnApi: this.params.columnApi
      };
      
      this.params.api.onFilterChanged(event);
    }
  }
}
```

For registration in your module (Angular), the newer versions of ag-Grid use `providedIn: 'root'` for services and components need to be properly declared:

```typescript
@NgModule({
  declarations: [
    AppComponent,
    CustomTextFloatingFilterComponent
  ],
  imports: [
    BrowserModule,
    AgGridModule
  ],
  // No need for withComponents in newer versions
})
export class AppModule { }
```

And then in your component where you define the grid:

```typescript
@Component({
  selector: 'app-grid',
  template: '<ag-grid-angular [columnDefs]="columnDefs" [rowData]="rowData"></ag-grid-angular>'
})
export class GridComponent {
  columnDefs = [
    {
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: CustomTextFloatingFilterComponent
    },
    // Other columns...
  ];
  
  // You also need to register the component with the grid
  components = {
    customTextFloatingFilter: CustomTextFloatingFilterComponent
  };
}
```

If you're still experiencing issues, you might need to use the `getFrameworkComponentInstance()` method for newer versions, like this:

```typescript
private applyFilter(): void {
  if (this.params.filterParams && this.params.column) {
    const column = this.params.column;
    
    if (this.currentValue) {
      const filterModel = {
        filterType: 'text',
        type: 'contains',
        filter: this.currentValue
      };
      
      this.params.api.setFilterModel({
        [column.getId()]: filterModel
      });
    } else {
      // Clear just this column's filter
      const currentFilterModel = this.params.api.getFilterModel() || {};
      delete currentFilterModel[column.getId()];
      this.params.api.setFilterModel(currentFilterModel);
    }
  }
}
```

This approach bypasses the need to access the filter instance directly and uses the grid API instead, which is more reliable in newer versions.​​​​​​​​​​​​​​​​

























/////....////////.
To add an 'x' button for clearing text in an ag-Grid floating filter while preserving the existing style, you'll need to create a custom floating filter component. Here's how you can implement this:

```typescript
import { IFloatingFilter, IFloatingFilterParams } from 'ag-grid-community';
import { Component } from '@angular/core';

@Component({
  selector: 'custom-text-filter',
  template: `
    <div class="ag-floating-filter-input" style="position: relative;">
      <input 
        #input
        [value]="currentValue"
        (input)="onInputChanged($event)"
        class="ag-floating-filter-full-width" 
        type="text"
        placeholder="Filter..."
      />
      <button 
        *ngIf="currentValue" 
        class="clear-button" 
        (click)="clearFilter()"
        style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); 
              background: none; border: none; cursor: pointer; padding: 0 5px;"
      >
        ✕
      </button>
    </div>
  `,
  styles: [`
    .clear-button:hover {
      color: #666;
    }
  `]
})
export class CustomTextFloatingFilterComponent implements IFloatingFilter {
  params: any;
  currentValue: string = '';

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
  }

  onParentModelChanged(parentModel: any): void {
    if (!parentModel) {
      this.currentValue = '';
    } else {
      this.currentValue = parentModel.filter || '';
    }
  }

  onInputChanged(event: any): void {
    this.currentValue = event.target.value;
    this.params.onFloatingFilterChanged({
      type: 'contains',
      filter: this.currentValue
    });
  }

  clearFilter(): void {
    this.currentValue = '';
    this.params.onFloatingFilterChanged(null);
  }
}
```

Then register and use this component in your column definitions:

```typescript
import { GridOptions } from 'ag-grid-community';
import { CustomTextFloatingFilterComponent } from './custom-text-floating-filter.component';

@Component({
  selector: 'app-grid',
  template: '<ag-grid-angular [gridOptions]="gridOptions"></ag-grid-angular>'
})
export class GridComponent {
  gridOptions: GridOptions = {
    // Other grid options...
    columnDefs: [
      {
        field: 'name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: CustomTextFloatingFilterComponent
      },
      // Other columns...
    ]
  };
}
```

Make sure to register your custom component in your module:

```typescript
@NgModule({
  declarations: [
    AppComponent,
    CustomTextFloatingFilterComponent
  ],
  imports: [
    BrowserModule,
    AgGridModule.withComponents([
      CustomTextFloatingFilterComponent
    ])
  ],
  // ...
})
export class AppModule { }
```

This implementation maintains the ag-Grid styling by using the existing ag-Grid classes and adding minimal custom styling for the clear button. The button only appears when there's text to clear, and it's positioned inside the input field.​​​​​​​​​​​​​​​​


















# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

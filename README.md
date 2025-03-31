
Mid-Year Goal: Config Service Platform
**Title:** Build a Hierarchical Configuration Service for Multi-Tenant Applications
**Owner:** Anand Rao
**Timeline:** H1 2025
**Type:** Strategic / Technical Platform Initiative
Goal Description
Develop a scalable configuration service to support dynamic, hierarchical settings for internal applications. The service will support configuration keys and values across multiple levels such as Application, Region, City, Department, Desk, and User. REST APIs will be exposed for full CRUD functionality, and an admin UI will enable internal teams to manage settings in real time. The platform will enable configuration inheritance, overrides, and promote reusability across applications and teams.
Success Criteria
Metric	Target
API Development	Expose secure REST endpoints for create, fetch, update, delete across all hierarchy levels
Hierarchy Support	Support cascading config by Application > Region > City > Department > Desk > User
Tech Stack	Implemented in either Java Spring Boot or Node.js (Express) with MongoDB
UI Delivery	React or Angular-based admin panel for managing config keys, overrides, and scopes
Reusability & Extensibility	Designed as a shared service to support at least 2 internal teams initially
Documentation	Published API and UI usage guide, inheritance rules, and onboarding examples
Notes for Manager
This goal supports platform unification and self-service capabilities by centralizing configuration management. It reduces hardcoded settings and application-specific configuration files, leading to faster deployments, better change management, and configuration portability across environments.
![image](https://github.com/user-attachments/assets/bc209d67-cf01-48bb-9ed8-aca97b6d33a9)



Mid-Year Goal: Grid Customization Tool
**Title:** Develop a Customizable Enterprise-Grade Grid Platform for Trading & Data Operations
**Owner:** Anand Rao
**Timeline:** H1 2025
**Type:** Strategic / Technical Execution
Goal Description
Design, build, and deliver a fully extensible and enterprise-ready ag-Grid customization tool that enables internal users to configure, preview, and persist complex grid behaviors across trading and risk management workflows. This tool will support real-time data interactions and fine-grained UI customization, and serve as the foundational layer for future blotter and dashboard components.
Success Criteria
Metric	Target
Technical Delivery	MVP deployed and accessible via GitHub Pages or internal environment by mid-year
Functionality Coverage	Supports at least 6 core customization domains (columns, formatting, rules, themes, components, persistence)
User Enablement	Includes visual rule editor and template-based expression builder to support non-dev users
Code Quality & Architecture	Modular React components with Tailwind, Zustand state management, and parameter-based theming
Integration Potential	Tool proven viable for integration into 2 or more desk-specific platforms (e.g., Structured Products blotter, Credit Dashboard)
Team Collaboration	Mentored at least 1 junior developer or shared knowledge via internal tech talk/code walkthrough
Notes for Manager
This tool is intended to reduce time-to-delivery for grid-based UIs by 50% and consolidate redundant implementations across teams. It also aligns with internal goals around standardizing UI/UX, improving data entitlement visibility, and enhancing desk autonomy
![image](https://github.com/user-attachments/assets/ef93f1aa-8f63-40cc-9279-5da84ace5201)














/***           **/


const gridOptions = {
  // Your other grid options
  
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
  },
  
  // Add event listeners for column changes
  onGridReady: function(params) {
    params.api.addEventListener('columnResized', function() {
      // Allow a small delay for the grid to stabilize after resize
      setTimeout(function() {
        params.api.refreshCells();
      }, 50);
    });
    
    // Optional: Also handle column visibility changes
    params.api.addEventListener('columnVisible', function() {
      setTimeout(function() {
        params.api.refreshCells();
      }, 50);
    });
  }
};

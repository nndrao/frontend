import { useEffect, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridOptions,
  ModuleRegistry,
  FirstDataRenderedEvent,
  themeQuartz,
  ValueFormatterParams
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

// Import AG Grid styles
//import 'ag-grid-community/styles/ag-grid.css';
//import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Types
interface LoadStats {
  fetchStartTime: number;
  fetchEndTime: number;
  renderStartTime: number;
  renderEndTime: number;
  rowCount: number;
  dataSize: string;
  compressedSize: string;
  compressionRatio: string;
  columnCount: number;
}

// Utility functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (ms: number): string => {
  return `${(ms / 1000).toFixed(2)} seconds`;
};

function App() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LoadStats | null>(null);

  const createColumnDefs = useCallback((data: any[]): ColDef[] => {
    if (!data.length) return [];
    
    return Object.keys(data[0]).map(key => {
      const sampleValue = data[0][key];
      const colDef: ColDef = {
        field: key,
        headerName: key.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ')
      };

      if (typeof sampleValue === 'number') {
        colDef.filter = 'agNumberColumnFilter';
        colDef.valueFormatter = (params: ValueFormatterParams) => {
          if (typeof params.value !== 'number') return params.value;
          return params.value.toLocaleString();
        };
      } else if (typeof sampleValue === 'boolean') {
        colDef.filter = 'agSetColumnFilter';
        colDef.cellRenderer = (params: any) => params.value ? 'Yes' : 'No';
      } else if (sampleValue instanceof Date || (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)))) {
        colDef.filter = 'agDateColumnFilter';
        colDef.valueFormatter = (params: any) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleString();
        };
      }

      return colDef;
    });
  }, []);

  const columnDefs = useMemo(() => createColumnDefs(rowData), [rowData, createColumnDefs]);

  const handleFirstDataRendered = useCallback((params: FirstDataRenderedEvent) => {
    const renderEndTime = performance.now();
    setStats(prev => prev ? {
      ...prev,
      renderEndTime,
    } : null);
  }, []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true
  }), []);

  
  const gridOptions: GridOptions = {
    columnDefs,
    defaultColDef,
    rowData,
    theme: themeQuartz,
    onFirstDataRendered: handleFirstDataRendered,
    sideBar: true,
    enableRangeSelection: true,
    enableCharts: true,
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' }
      ]
    },
    rowGroupPanelShow: 'always'
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setStats(null);
    setRowData([]);
    
    const fetchStartTime = performance.now();
    
    try {
      const response = await fetch('http://localhost:3000/data', {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip'
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Get the response data - browser will automatically handle decompression
      const data = await response.json();
      const fetchEndTime = performance.now();
      const renderStartTime = performance.now();

      // Update row data with the complete dataset
      setRowData(data);
      
      // Calculate statistics
      const transferSize = parseInt(response.headers.get('content-length') || '0', 10);
      const originalSize = parseInt(response.headers.get('x-original-size') || '0', 10);
      const compressionRatio = response.headers.get('x-compression-ratio') || '0';
      const totalRecords = parseInt(response.headers.get('x-total-records') || '0', 10);

      console.log('Data loaded:', {
        records: data.length,
        sampleRecord: data[0],
        transferSize,
        originalSize
      });

      setStats({
        fetchStartTime,
        fetchEndTime,
        renderStartTime,
        renderEndTime: performance.now(),
        rowCount: data.length,
        dataSize: formatBytes(originalSize),
        compressedSize: formatBytes(transferSize),
        compressionRatio: `${compressionRatio}%`,
        columnCount: Object.keys(data[0] || {}).length
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Financial Data Analytics</h1>
          <div>Live market data and analysis</div>
        </div>
        <button onClick={loadData} disabled={loading}>
          {loading ? '⟳ Loading...' : '↻ Refresh Data'}
        </button>
      </div>

      <div style={{ padding: '1rem' }}>
        {error && (
          <div style={{ color: 'red' }}>⚠️ {error}</div>
        )}

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>Rows: {stats.rowCount.toLocaleString()}</div>
            <div>Columns: {stats.columnCount}</div>
            <div>Data Size: {stats.dataSize}</div>
            <div>Compressed: {stats.compressedSize}</div>
            <div>Compression: {stats.compressionRatio}</div>
            <div>Response Time: {formatTime(stats.fetchEndTime - stats.fetchStartTime)}</div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} className="ag-theme-quartz">
        <AgGridReact {...gridOptions} />
      </div>

      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {stats && stats.renderEndTime > 0 && (
            `Render Time: ${formatTime(stats.renderEndTime - stats.renderStartTime)}`
          )}
        </div>
        <div>
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default App;

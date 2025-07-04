 //sidebar
 
 function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content');
    sidebar.classList.toggle('collapsed');

  
    if (content) {
      if (sidebar.classList.contains('collapsed')) {
        content.style.marginLeft = 'var(--sidebar-collapsed-width)';
      } else {
        content.style.marginLeft = 'var(--sidebar-width)';
      }
    }
  }

 // display data in table

 const insertedDataKeys = new Set();

function createDataKey(data) {
  return `${data.corner || ''}|${data.long}|${data.lat}`;
}

function appendToTable(data) {
  const tbody = document.getElementById('coordinatesTable');

  if (tbody.querySelector('td[colspan]')) {
    tbody.innerHTML = '';
  }

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center align-middle">${data.corner || ''}</td>
    <td class="text-center align-middle">${data.long}</td>
    <td class="text-center align-middle">${data.lat}</td>
    <td class="text-center align-middle">
      <button class="btn btn-primary btn-sm update-btn" data-id="${data.id}">
        <i class="bi bi-arrow-clockwise"></i> Update
      </button>
      <button class="btn btn-danger btn-sm delete-btn" data-id="${data.id}">
        <i class="bi bi-trash"></i> Delete
      </button>
    </td>
  `;

  tbody.appendChild(tr);

  // Update event
  tr.querySelector('.update-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const id = e.currentTarget.getAttribute('data-id');
    try {
      const resp = await fetch(`http://localhost:3000/data/${id}`);
      if (resp.ok) {
        const item = await resp.json();
        const form = document.getElementById('coordinatesForm');
        form.querySelector('input[name="corner"]').value = item.corner || '';
        form.querySelector('input[name="long"]').value = item.long;
        form.querySelector('input[name="lat"]').value = item.lat;
        form.setAttribute('data-edit-id', id);

        const inputModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('inputModal'));
        inputModal.show();
      } else {
        alert('Failed to fetch data for update');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // Delete event
  tr.querySelector('.delete-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const id = e.currentTarget.getAttribute('data-id');
    try {
      const resp = await fetch(`http://localhost:3000/data/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        tr.remove();
        insertedDataKeys.delete(createDataKey(data));
        if (!tbody.children.length) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data</td></tr>';
        }

        toastr.options = {
          closeButton: true,
          progressBar: true,
          positionClass: 'toast-bottom-right',
          timeOut: '4000',
          preventDuplicates: true, // Prevent duplicate messages
        };
        toastr.success('Data deleted successfully!');
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  });
}

async function fetchData() {
  try {
    const resp = await fetch('http://localhost:3000/data/display_data');
    if (resp.ok) {
      const data = await resp.json();
      const tbody = document.getElementById('coordinatesTable');
      tbody.innerHTML = '';
      insertedDataKeys.clear();

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data</td></tr>';
        return;
      }

      data.forEach(item => {
        const key = createDataKey(item);
        insertedDataKeys.add(key);
        appendToTable(item);
      });
    }
  } catch (err) {
    alert('Fetch error: ' + err.message);
  }
}

document.getElementById('coordinatesForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const corner = formData.get('corner') || '';
  const longRaw = formData.get('long');
  const latRaw = formData.get('lat');

  const long = parseFloat(longRaw);
  const lat = parseFloat(latRaw);

  if (longRaw === null || longRaw.trim() === '' || isNaN(long)) {
    alert('Please enter a valid longitude.');
    return;
  }

  if (latRaw === null || latRaw.trim() === '' || isNaN(lat)) {
    alert('Please enter a valid latitude.');
    return;
  }

  const data = { corner, long, lat };
  const editId = this.getAttribute('data-edit-id');
  const key = createDataKey(data);

  if (!editId && insertedDataKeys.has(key)) {
    alert('Data already inserted.');
    return;
  }

  try {
    let resp;
    if (editId) {
      resp = await fetch(`http://localhost:3000/data/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      resp = await fetch('http://localhost:3000/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    if (resp.ok) {
      const result = await resp.json();

      // Show Toastr success message
      toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-bottom-right', // Fixed position
        timeOut: '4000',
        preventDuplicates: true, // Prevent duplicate messages
      };
      toastr.success(editId ? 'Data updated successfully!' : 'Data added successfully!');

      // Hide input modal
      const inputModalEl = document.getElementById('inputModal');
      const inputModal = bootstrap.Modal.getInstance(inputModalEl);
      if (inputModal) {
        inputModal.hide();
      }

      if (editId) {
        insertedDataKeys.clear();
        document.getElementById('coordinatesTable').innerHTML = '';
        await fetchData();
        this.removeAttribute('data-edit-id');
      } else {
        insertedDataKeys.add(key);
        appendToTable(result);
      }

      this.reset();
    } else if (resp.status === 409) {
      alert('Duplicate entry.');
    } else {
      alert('Failed to save data.');
    }
  } catch (err) {
    alert('Submit error: ' + err.message);
  }
});

window.addEventListener('load', fetchData);




//  insert table in index.html
    
const table = document.getElementById('editableTable');
const tbody = table.querySelector('tbody');
let selectedCell = null;


function addNewRow() {
  const newRow = tbody.insertRow();
  for (let i = 0; i < table.rows[0].cells.length; i++) {
    const newCell = newRow.insertCell();
    newCell.contentEditable = "true";
    newCell.setAttribute('aria-label', table.tHead.rows[0].cells[i].textContent);
  }
  return newRow;
}

tbody.addEventListener('focusin', e => {
  if (e.target.tagName === 'TD' && e.target.isContentEditable) {
    selectedCell = e.target;
  }
});

tbody.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    
    const cell = e.target;
    const row = cell.parentElement;
    const isLastCell = cell.cellIndex === row.cells.length - 1;

    if (isLastCell) {
      const newRow = addNewRow();
      setTimeout(() => newRow.cells[0].focus(), 0);
    } else {
      row.cells[cell.cellIndex + 1].focus();
    }
  }
});

tbody.addEventListener('paste', (event) => {
  if (!selectedCell) return;

  event.preventDefault();
  const pasteData = (event.clipboardData || window.clipboardData).getData('text');
  const rows = pasteData.trim().split(/\r\n|\n|\r/).map(row => row.split('\t'));

  const startRow = selectedCell.parentElement.rowIndex - 1;
  const startCol = selectedCell.cellIndex;

  while (tbody.rows.length < startRow + rows.length) {
    addNewRow();
  }

  rows.forEach((rowData, rowIndex) => {
    const row = tbody.rows[startRow + rowIndex];
    while (row.cells.length < startCol + rowData.length) {
      const newCell = row.insertCell();
      newCell.contentEditable = "true";
      newCell.setAttribute('aria-label', 'Extra column');
    }

    rowData.forEach((cellData, colIndex) => {
      const cell = row.cells[startCol + colIndex];
      cell.textContent = cellData;
      
      if (isCoordinateCell(startCol + colIndex)) {
        const converted = convertToLatLong(cellData);
        if (converted !== cellData) {
          cell.textContent = converted;
          cell.setAttribute('data-original-coords', cellData);
        }
      }
    });
  });
});

document.getElementById('submitBtn').addEventListener('click', async () => {
  const data = [];
  
  for (let r = 0; r < tbody.rows.length; r++) {
    const row = tbody.rows[r];
    const rowData = [];
    
    for (let c = 0; c < row.cells.length; c++) {
      let cellValue = row.cells[c].textContent.trim();
      
      if (isCoordinateCell(c)) {
        cellValue = convertToLatLong(cellValue);
      }
      
      rowData.push(cellValue);
    }
    
    data.push(rowData);
  }

  try {
    const response = await fetch('http://localhost:3000/data/more_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (result?.success !== false) {

      alert('Data submitted successfully!');
      
    } else {
      throw new Error('Unexpected server response');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error submitting data: ' + error.message);
  }
});

function isCoordinateCell(cellIndex) {
  const headers = Array.from(table.tHead.rows[0].cells).map(c => c.textContent.toLowerCase());
  const currentHeader = headers[cellIndex];
  return currentHeader.includes('utm') || 
         currentHeader.includes('dms') || 
         currentHeader.includes('coord') ||
         currentHeader.includes('latitude') ||
         currentHeader.includes('longitude') ||
         currentHeader.includes('position');
}

function convertToLatLong(input) {
  if (!input) return input;
  

  const decimalPattern = /^-?\d{1,3}\.?\d*,\s*-?\d{1,3}\.?\d*$/;
  if (decimalPattern.test(input)) {
    return input;
  }
  
  const utmResult = convertUTMToLatLong(input);
  if (utmResult !== input) return utmResult;
  

  const dmsResult = convertDMSToLatLong(input);
  if (dmsResult !== input) return dmsResult;
  
  // Return original if no conversion was made
  return input;
}

function convertUTMToLatLong(input) {
  const utmPatterns = [
    /^(?:(\d{1,2}[A-Za-z])\s*)?(\d{1,7}(?:\.\d+)?)[\s,;]+(\d{1,7}(?:\.\d+)?)$/,
    /^(\d{1,7}(?:\.\d+)?)[\s,;]+(\d{1,7}(?:\.\d+)?)$/
  ];
  
  for (const pattern of utmPatterns) {
    const match = input.match(pattern);
    if (match) {
      try {
        const zone = match[1] || '51N';
        const easting = parseFloat(match[2]);
        const northing = parseFloat(match[3] || match[2]);
 
        const lat = northing / 110574; 
        const long = easting / (111320 * Math.cos(lat * Math.PI / 180));
        
        return `${lat.toFixed(6)}, ${long.toFixed(6)}`;
      } catch (e) {
        console.warn("UTM conversion error:", e);
        return input;
      }
    }
  }
  
  return input;
}

function convertDMSToLatLong(input) {
  const dmsPatterns = [
    /(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)(?:["″]?)\s*([NSEWnsew]),?\s*(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)(?:["″]?)\s*([NSEWnsew])/,
    /(\d{1,3})[°\s](\d{1,2})['\s](\d{1,2}(?:\.\d+)?)\s*([NSEWnsew]),?\s*(\d{1,3})[°\s](\d{1,2})['\s](\d{1,2}(?:\.\d+)?)\s*([NSEWnsew])/,
    /^(\d{2,3})(\d{2})(\d{2}(?:\.\d+)?)([NSEWnsew])\s*(\d{2,3})(\d{2})(\d{2}(?:\.\d+)?)([NSEWnsew])$/
  ];
  
  for (const pattern of dmsPatterns) {
    const match = input.match(pattern);
    if (match) {
      try {
        let latDeg, latMin, latSec, latDir, longDeg, longMin, longSec, longDir;
        
        if (match[0].includes('°') || match[0].includes("'")) {
 t
          latDeg = parseFloat(match[1]);
          latMin = parseFloat(match[2]);
          latSec = parseFloat(match[3] || '0');
          latDir = match[4].toUpperCase();
          
          longDeg = parseFloat(match[5]);
          longMin = parseFloat(match[6]);
          longSec = parseFloat(match[7] || '0');
          longDir = match[8].toUpperCase();
        } else {
       
          latDeg = parseFloat(match[1]);
          latMin = parseFloat(match[2]);
          latSec = parseFloat(match[3] || '0');
          latDir = match[4].toUpperCase();
          
          longDeg = parseFloat(match[5]);
          longMin = parseFloat(match[6]);
          longSec = parseFloat(match[7] || '0');
          longDir = match[8].toUpperCase();
        }
        
  
        if (latDeg < 0 || latDeg > 90 || longDeg < 0 || longDeg > 180) {
          return input;
        }
        if (latMin < 0 || latMin >= 60 || longMin < 0 || longMin >= 60) {
          return input;
        }
        if (latSec < 0 || latSec >= 60 || longSec < 0 || longSec >= 60) {
          return input;
        }
        
    
        const lat = latDeg + latMin/60 + latSec/3600;
        const long = longDeg + longMin/60 + longSec/3600;
        
 n
        const latFinal = latDir === 'S' ? -lat : lat;
        const longFinal = longDir === 'W' ? -long : long;
        
       
        return `${latFinal.toFixed(6)}, ${longFinal.toFixed(6)}`;
      } catch (e) {
        console.warn("DMS conversion error:", e);
        return input;
      }
    }
  }
  
  return input;
}

if (tbody.rows.length === 0) addNewRow();


// search function

 document.getElementById('searchInput').addEventListener('input', function () {
  const filter = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll('#coordinatesTable tr:not(.no-data-row)');
  const noDataRow = document.querySelector('.no-data-row');
  let hasMatch = false;

  rows.forEach(row => {
    const cornerCell = row.cells[0]; // Only search in Corner column
    if (cornerCell) {
      const text = cornerCell.textContent.toLowerCase();
      if (!filter || text.includes(filter)) {
        row.style.display = '';
        hasMatch = true;
      } else {
        row.style.display = 'none';
      }
    }
  });

  // Show/hide "No data" row
  if (noDataRow) {
    noDataRow.style.display = hasMatch ? 'none' : '';
  }
});

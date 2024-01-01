fetch('/api')
  .then(res => res.json())
  .then(data => {
    console.log(data)
    document.getElementById('root')
      .innerHTML = data.message;
  })
  .catch(err => console.error(err));

const bindListClick = (button) => {
  button.addEventListener('click', () => {
    const li = button.parentElement;
    const model = li.dataset.id;
    // remove isActive class
    const activeItem = document.querySelector(`.list-group-item.${activeClass}`);
    if (activeItem)
      activeItem.classList.remove(activeClass);

    // add isActive class
    button.parentElement.classList.add(activeClass);

    loadPageIndex(model, 1);
  });
}

const renderListModels = (listModels) => {
  const ulModel = document.getElementById('models');
  ulModel.innerHTML = '';
  listModels.forEach(model => {
    const liModel = document.createElement('li');
    liModel.className = 'list-group-item d-flex justify-content-between align-items-center';
    liModel.innerHTML = templateModelItem;
    liModel.querySelector('.model-name').innerText = model.name;
    const button = liModel.querySelector('.show-records');
    liModel.dataset.id = model.id;
    bindListClick(button);
    liModel.querySelector('.show-records').innerHTML = 'Load Records';
    ulModel.appendChild(liModel);
  });
};

const bindDetailClick = (button) => {
  // console.log('bindDetailClick', button);
  button.addEventListener('click', () => {
    const li = document.querySelector(`li.${activeClass}`);
    console.log('li', li);
    const model = li.dataset.id;
    const id = button.dataset.id;
    fetch(`/api/${model}/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log(id, data);
        const detailCode = document.getElementById('detail');
        if (detailCode) {
          if (detailCode.parentElement.classList.contains('d-none'))
            detailCode.parentElement.classList.remove('d-none');

          detailCode.innerHTML = JSON.stringify(data, '\r\n', 2);
          // scroll window to
          const offset = detailCode.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo(0, offset);
        }
      })
      .catch(err => console.error(err));
  });
};

const loadPageIndex = (model, currentPage) => {
  const limit = 10;
  const offset = (currentPage - 1) * limit;
  fetch(`/api/${model}/?&limit=${limit}&offset=${offset}`)
    .then(res => res.json())
    .then(data => {
      console.log(model, data);
      const table = jsonToTable(data.rows);
      const mainTable = document.getElementById('records');
      if (mainTable) {
        mainTable.innerHTML = table.innerHTML;
        bindAllIdColumnClick();
      }

      renderPagination(model, data.total, 10, currentPage);
    })
    .catch(err => console.error(err))
};

const getPagingItems = (total, perPage, currentPage, maxItems) => {
  const totalPages = Math.ceil(total / perPage);

  // Ensure current page is within valid range
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const items = [];

  // Include first page
  items.push({ type: 'page', number: 1, text: 'First' });

  // Calculate the range of pages to display around the current page
  const startPage = Math.max(1, currentPage - Math.floor(maxItems / 2));
  const endPage = Math.min(totalPages, startPage + maxItems - 1);

  // Include page numbers within the range
  for (let i = startPage; i <= endPage; i++) {
    items.push({ type: 'page', number: i, text: i, current: i === currentPage });
  }

  // Include last page
  items.push({ type: 'page', number: totalPages, text: 'Last' });

  return items;
};

const renderPagination = (model, total, perPage, page) => {
  const pagination = document.getElementById('pagination');
  if (pagination) {
    pagination.innerHTML = '';
    const items = getPagingItems(total, perPage, page, 5);
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = `page-item${item.current ? ' active' : ''}`;
      const link = document.createElement('a');
      link.className = 'page-link';
      link.href = '#';
      link.dataset.page = item.number;
      link.textContent = item.text;
      link.addEventListener('click', (event) => { event.preventDefault(); loadPageIndex(model, item.number); });
      li.appendChild(link);
      pagination.appendChild(li);
    });
  }
};

const bindAllIdColumnClick = () => {
  const tds = document.querySelectorAll('td[data-id]');
  tds.forEach(td => {
    td.classList.add('cursor-pointer');
    bindDetailClick(td);
  });
};

const jsonToTable = (json) => {
  const table = document.createElement('table');
  table.className = 'table table-striped';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const headers = Object.keys(json[0]);
  const headerRow = document.createElement('tr');
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.innerText = headerText;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  json.forEach((rowData) => {
    const tr = document.createElement('tr');
    headers.forEach((headerText, index) => {
      const td = document.createElement('td');
      td.innerText = rowData[headerText];
      if (index === 0)
        td.setAttribute('data-id', rowData[headerText]);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
};



const activeClass = 'bg-warning';
const templateModelItem = `
  <span class="model-name"></span>
  <button class="btn btn-primary show-records btn-sm"></button>
`;

const listModels = [
  { id: 'albums', name: 'Albums' },
  { id: 'artists', name: 'Artists' },
  { id: 'customers', name: 'Customers' },
  { id: 'employees', name: 'Employees' },
  { id: 'genres', name: 'Genres' },
  // { id: 'invoice_items', name: 'Invoice Items' },
  { id: 'invoices', name: 'Invoices' },
  { id: 'media-types', name: 'Media Types' },
  { id: 'playlists', name: 'Playlists' },
  { id: 'tracks', name: 'Tracks' }
];

renderListModels(listModels);

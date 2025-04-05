;(function (doc) {
  var oApp = doc.getElementById('app');
  var oTable = oApp.getElementsByClassName('J_Table')[0];
  var oTotal = oApp.getElementsByClassName('J_Total')[0];
  var oSearchInput = oApp.getElementsByClassName('J_SearchInput')[0];
  var oSearchButton = oApp.getElementsByClassName('J_SearchButton')[0];

  var state = {
    requestParams: {
      pageNum: 1,
      pageSize: 10,
      name: ''
    },
    tableData: [],
    total: 0,
  };

  var template = {
    TableHeader: function () {
      return `
        <tr align="left">
          <th>ID</th>
          <th>姓名</th>
          <th>年龄</th>
          <th>性别</th>
          <th>语文</th>
          <th>数学</th>
          <th>英语</th>
          <th>出勤天数</th>
        </tr>
      `;
    },
    TableItem: function (item) {
      return `
        <tr>
          <td data-id=${item.id}>${item.id}</td>
          <td>${item.name}</td>
          <td>${item.age}</td>
          <td>${item.gender == '1' ? '男' : '女'}</td>
          <td>${item.scoreInfo.chineseScore}</td>
          <td>${item.scoreInfo.mathScore}</td>
          <td>${item.scoreInfo.englishScore}</td>
          <td>${item.attendInfo.attendDays}</td>
        </tr> 
      `;
    }
  };

  var init = function () {
    fetchData(
      state.requestParams.pageNum,
      state.requestParams.pageSize,
      state.requestParams.name
    );
    bindEvent();
  }

  function renderTable(root, data) {
    var html = `
      <thead>
        ${template.TableHeader()}
      </thead>
      <tbody>
        ${data.map(item => template.TableItem(item)).join('')}
      </tbody>
    `;
    root.innerHTML = html;
  }

  async function fetchData(pageNum, pageSize, name) {
    const { code, data, message } = await fetch(
      `/student/info?pageNum=${pageNum}&pageSize=${pageSize}&name=${name}`
    )
      .then(res => res.json());
    if (code !== 0) {
      window.alert(message);
      return;
    }
    state.tableData.length = 0;
    state.tableData.push(...data.list);
    state.total = data.total;

    renderTable(oTable, state.tableData);
    oTotal.innerHTML = `总计：${state.total}条`;
  }

  function bindEvent() {
    oSearchInput.addEventListener('keypress', handleSearchInputKeyPress, false);
    oSearchButton.addEventListener('click', handleSearchButtonClick, false);
  }

  function handleSearchButtonClick() {
    var inputValue = oSearchInput.value.trim();
    state.requestParams.name = inputValue;
    state.requestParams.pageNum = 1;
    fetchData(
      state.requestParams.pageNum,
      state.requestParams.pageSize,
      state.requestParams.name
    );
  }

  function handleSearchInputKeyPress(e) {
    if (e.keyCode !== 13) return;
    handleSearchButtonClick();
  }

  init();
})(document);
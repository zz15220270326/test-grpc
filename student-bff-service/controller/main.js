const studentClient = require('../client/student');

exports.getIndexPage = (req, res) => {
  const env = req.headers['x-render-env'];

  switch (env) {
    case 'client':
      res.redirect('/client');
      break;
    case 'ssr':
      res.redirect('/ssr');
      break;
    default:
      res.redirect('/client');
      break;
  }
}

exports.getClientPage = (req, res) => {
  res.render('client', {});
};

exports.getSsrPage = async (req, res) => {
  try {
    const pageNum = req.query.pageNum ? Number(req.query.pageNum) : 1;
    const pageSize = req.query.pageSize? Number(req.query.pageSize) : 10;
    const name = req.query.name? String(req.query.name) : '';

    const studentInfoList = await studentClient.getStudentInfoList({
      pageNum,
      pageSize,
      name,
    });

    const studentIds = studentInfoList.list.map((item) => Number(item.id));
    
    const studentScoreInfoList = await studentClient.getStudentScoreList({
      pageNum: 1,
      pageSize: 500,
      studentIds,
    });
    const studentAttendInfoList = await studentClient.getStudentAttendList({
      pageNum: 1,
      pageSize: 500,
      studentIds,
    });

    // 聚合数据
    studentInfoList.list.forEach((item) => {
      item.scoreInfo = studentScoreInfoList.list.find((scoreItem) => scoreItem.studentId == item.id);
      if (item.scoreInfo.studentId) {
        delete item.scoreInfo.studentId;
      }

      item.attendInfo = studentAttendInfoList.list.find((attendItem) => attendItem.studentId == item.id);
      if (item.attendInfo.studentId) {
        delete item.attendInfo.studentId;
      }
    });

    res.render('ssr', {
      total: studentInfoList.total,
      list: studentInfoList.list,
    });
  } catch (e) {
    res.render('ssr', {
      total: 0,
      list: [],
      error: e.message || e.stack,
    });
  }
};

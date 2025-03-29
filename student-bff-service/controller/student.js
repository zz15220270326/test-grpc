const studentClient = require('../client/student');
const BaseDTO = require('../util/BaseDTO');

exports.getInfoList = async (req, res) => {
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

    res.status(200).json(BaseDTO.success(studentInfoList));
  } catch (e) {
    res.status(405).json(BaseDTO.error(e?.message ?? e));
  }
}
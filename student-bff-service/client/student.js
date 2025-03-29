const { StudentApi } = require('../config/api');
const GrpcClient = require('../util/GrpcClient');

const studentGrpcClient = new GrpcClient({
  host: StudentApi.host,
  port: StudentApi.port,
  packageName: StudentApi.packageName,
  protoFilePath: StudentApi.protoFilePath,
  isShowLog: true,
});

const studentApi = StudentApi.api;

async function getStudentInfoList(params = {
  pageNum: 1,
  pageSize: 10,
  name: '',
}) {
  try {
    const data = await studentGrpcClient.request(
      studentApi.GetStudentInfoList.serviceName,
      studentApi.GetStudentInfoList.methodName,
      {
        ...studentApi.GetStudentInfoList.defaultParams,
        ...params,
      },
    );
    return data;
  } catch (e) {
    return null;
  }
}

async function getStudentScoreList(params = {
  pageNum: 1,
  pageSize: 10,
  studentIds: [],
}) {
  try {
    const data = await studentGrpcClient.request(
      studentApi.GetStudentScoreList.serviceName,
      studentApi.GetStudentScoreList.methodName,
      {
       ...studentApi.GetStudentScoreList.defaultParams,
       ...params,
      },
    );
    return data;
  } catch (e) {
    return null;
  }
}

async function getStudentAttendList(params = {
  pageNum: 1,
  pageSize: 10,
  studentIds: [],
}) {
  try {
    const data = await studentGrpcClient.request(
      studentApi.GetStudentAttendList.serviceName,
      studentApi.GetStudentAttendList.methodName,
      {
      ...studentApi.GetStudentAttendList.defaultParams,
      ...params,
      },
    );
    return data;
  } catch (e) {
    return null;
  }
}

module.exports = {
  getStudentInfoList,
  getStudentScoreList,
  getStudentAttendList,
};

const { resolve } = require('path');

const BASE_URL = 'localhost';

const StudentApi = {
  host: BASE_URL,
  port: 50001,
  protoFilePath: resolve(__dirname, '../proto/Student.proto'),
  packageName: 'student',

  api: {
    GetStudentInfoList: {
      serviceName: 'StudentService',
      methodName: 'getStudentInfoList',
      defaultParams: {
        pageNum: 1,
        pageSize: 10,
        name: '',
      },
    },

    GetStudentScoreList: {
      serviceName: 'StudentService',
      methodName: 'getStudentScoreList',
      defaultParams: {
        pageNum: 1,
        pageSize: 10,
        // id: 0,
      },
    },

    GetStudentAttendList: {
      serviceName: 'StudentService',
      methodName: 'getStudentAttendList',
      defaultParams: {
        pageNum: 1,
        pageSize: 10,
        // id: 0,
      },
    },
  },
};

module.exports = {
  StudentApi,
};

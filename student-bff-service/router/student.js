const { Router } = require('express');

const studentController = require('../controller/student');

const StudentRouter = Router();

StudentRouter.get('/info', studentController.getInfoList);

module.exports = StudentRouter;

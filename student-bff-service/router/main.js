const { Router } = require('express');
const mainController = require('../controller/main');

const main = Router();

main.get('/', mainController.getIndexPage);

module.exports = main;

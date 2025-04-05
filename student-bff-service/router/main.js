const { Router } = require('express');
const mainController = require('../controller/main');

const main = Router();

main.get('/', mainController.getIndexPage)
main.get('/client', mainController.getClientPage);
main.get('/ssr', mainController.getSsrPage);

module.exports = main;

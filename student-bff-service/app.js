const express = require('express');
const { CrossOrigin } = require('./middleware');

const app = express();

app.use(CrossOrigin);

app.use('/', require('./router/main'));
app.use('/student', require('./router/student'));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.listen(50002, () => {
  console.log('Bff application is running on port 50002');
});

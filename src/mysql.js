var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'gz-cdb-jptqaaf0.sql.tencentcdb.com',
  port:'63759',
  user     : 'root',
  password : 'geeku@2017',
  database : 'test'
});

connection.connect();

connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

connection.end();
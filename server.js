var app = require('./server/server-config');
var mongoDB = require('./bdmgd/conexion');
var mail = require('./util-implements/mail/configuracion/conf');
mongoDB.conectar().then((mdb) => {
    if (mdb.error == true) {

        mail.senMail();
        console.log('servidor de base de datos no funcionando');
    } else {
        console.log('servidor de base de datos funcionando');
    }
});
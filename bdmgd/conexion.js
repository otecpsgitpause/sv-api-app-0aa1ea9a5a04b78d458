var mongoose = require('mongoose');
var crypto = require('../util-implements/cryptojs-implement');
//var mail = require('../../util-implements/mail/configuracion/conf');
var conexion = {
    conectar: conectar
}

var dconect= process.env.conectString;

function conectar() {
    return new Promise((resolve, reject) => {
        crypto.decode(dconect).then((dd)=>{
            mongoose.connect(dd, { useMongoClient: true, promiseLibrary: global.Promise }, (err) => {
                console.log({conexionbd:err});
                if (err != null) {
    
                    resolve({ error: true });
    
                } else {
                    resolve({ error: false, type: err });
                }
            });
        })
        
    })

}

module.exports = conexion;

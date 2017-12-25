var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var frontPageAdm = Schema({
   
    imagenes:{
        slider:[]
    },
    alertasMensajes:[],
    posiciones:[],
    botonesPago:[],
    identificador:Object

    
});
module.exports = mongoose.model('frontpageadm', frontPageAdm);
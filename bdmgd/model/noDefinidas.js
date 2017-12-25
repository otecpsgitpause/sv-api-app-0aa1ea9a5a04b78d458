var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cursos = Schema({
    curso: Object
});
module.exports = mongoose.model('nodefinidos', cursos);
'use strict'
var express = require('express');
var app= require('../controllers/app-controller.js');
var tokenImpl = require('../util-implements/token-implement');
var secureRouter = express.Router();
var api = express.Router();
secureRouter.use(tokenImpl.tokenImpl.tokenImpl);

//9001b1  0xTU7FcVs7dfyttQ6EAG2fXvCkYYK0zZdrXZ4Mk7
secureRouter.post('/xgnto85VbsU2wJtvLD6Mysq7wG2XGcNyh3eeCpGdW0u',app.cursos.getCursos);
//9901b2
secureRouter.post('/YdLFhGHdcI5OhmpUmTqrd3Pex0ULn4O2xpJsEGMrB9w',app.sence._v_alumno);
//9001b3
secureRouter.post('/pDgZuqctmhOovZTSjkAmeK2g3VT0KhPXcrlMKptdhR7',app.ventas.cursos);
//9001b4
secureRouter.post('/ArZnrcxZWyIvvb1n0GvJc61243iMKyPsTr3AkFr8jp3',app.ventas.getbotones);
//9001b5
secureRouter.post('/yrB1I9O7AsyBRwztQN3d1HHmlvcc5Hz8le5qdhLeZfD',app.usuarios.getPerfil);
//9001b6
secureRouter.post('/mg7GL10EwcOSmjTlyzRQYLA6puukWJ3tr8HPrMG7dsB',app.usuarios.setPerfil);
//9001b7
secureRouter.post('/FXxT0BxR15MqYoscYNaB622nCosIw6Jfx65V4pxiBjw',app.ventas.transaccionPayPal);
api.post('/prueba',app.ventas.transaccionPayPal);
module.exports ={secure:secureRouter,prueba:api};
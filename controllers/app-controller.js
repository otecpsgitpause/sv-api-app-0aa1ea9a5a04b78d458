'use strict'
var mgbCNDModel = require('../bdmgd/model/noDefinidas');
var mgbCursosModel = require('../bdmgd/model/cursos');
var mgbUsuariosModel = require('../bdmgd/model/usuarios');
var mgbfrontPageModel = require('../bdmgd/model/frontPageAdm');
var mgbpeticionesCurso = require('../bdmgd/model/peticionesCurso');
var crypto = require('../util-implements/cryptojs-implement');
var soap = require('soap');
var client = process.env.client_id;
var cs = process.env.client_secret;
const paypal = require('paypal-rest-sdk');
const paypalnvp = require('paypal-nvp-api');
var first_config = {
    'mode': 'live',
    'client_id': client,
    'client_secret': cs

};

paypal.configure(first_config);
var _ = require('lodash');
var moment = require('moment');

/*var PaypalTokenStrategy = require('passport-paypal-token');
var passport= require('passport');*/



var app = {

    cursos: {
        getCursos: getCursos,

    },
    sence: {
        _v_alumno: _v_alumno
    },
    ventas: {
        cursos: ventaCursos,
        getbotones: getbotones,
        transaccionPayPal: transaccionPayPal
    },
    usuarios: {
        getPerfil: getPerfil,
        setPerfil: setPerfil
    }



}

function getPerfil(req, res) {
    try {
        let usuario = req.body.data;
        let identificador = req.body.IdentificadorApp;

        console.log({ dataConsultagetPerfil: usuario, identificador: identificador });
        mgbUsuariosModel.findOne({ "cliente.email": usuario.email }, (err, resUsuario) => {
            if (err == null && resUsuario != null) {
                method.respuesta({ perfil: resUsuario.cliente, error: false, mensaje: null })
            } else {
                method.respuesta({ perfil: null, error: true, mensaje: null })
            }
            console.log({ err: err, resUsuario: resUsuario });
        })
    } catch (e) {
        method.respuesta({ perfil: false, error: true, mensaje: 'no se pudo concretar su solicitud' })
    }


    var method = {
        respuesta: (item) => {
            let strgData = JSON.stringify({ data: { perfil: item.perfil, error: item.error, mensaje: item.mensaje } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true
                })
            })
        }

    }
}

function setPerfil(req, res) {
    try {
        let data = req.body;
        let perfil = data.data;
        let identificador = data.IdentificadorApp;
        let usuario = new mgbUsuariosModel();
        let ident = { key: identificador }
        let rol = { type: 'estudiante' };
        mgbUsuariosModel.findOne({ "cliente.email": perfil.email }, (err, userSearch) => {
            console.log({ usuarioEncontrado: userSearch, errUsuarioEncontrado: err });
            if (err == null) {
                if (userSearch == null) {
                    method.verificarPaypal(perfil).then((verificacion)=>{
                        console.log({verificacionCuentaPaypal:verificacion});
                        if(verificacion==true){
                            usuario.identificador = ident;
                            usuario.rol = rol;
                            usuario.cliente = perfil;
                            usuario.cursosSuscrito = [];
                            usuario.temPruebaInit = null;
                            usuario.save((err, guard) => {
                                if (err) {
                                    method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al concretar su solicitud' })
                                } else {
                                    if (!guard) {
                                        method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al actualizar el perfil' })
                                    } else {
                                        mgbUsuariosModel.findOne({ "cliente.rut": perfil.rut }, (errSearchSave, userSearchSave) => {
                                            if (errSearchSave == null && userSearchSave != null) {
                                                method.respuesta({ perfil: userSearchSave.cliente, error: false, mensaje: 'Perfil actualizado con exito' })
                                            } else {
                                                method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al actualizar el perfil' })
                                            }
                                        })
                                    }
                                }
                            })
                        }else{
                            method.respuesta({ perfil: null, error: true, mensaje: 'La cuenta paypal está siendo utilizada por otro usuario' }) 
                        }
                    })
           
                } else {
                    method.buscarUsuario(perfil);
      

        
                }
            } else {
                method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al concretar su solicitud' })
            }

     


        })


    
 

    } catch (e) {
        method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al concretar su solicitud' })
    }

    var method = {
        respuesta: (item) => {
            let strgData = JSON.stringify({ data: { perfil: item.perfil, error: item.error, mensaje: item.mensaje } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true
                })
            })
        },
        buscarUsuario:(perfil)=>{
            mgbUsuariosModel.find({},(err,resClientesOtec)=>{
                if(err==null && resClientesOtec.length>0){
                    let idxClient = _.findIndex(resClientesOtec,(o)=>{
                        return o.cliente.correoPago==perfil.correoPago ;
                    })

                    if(idxClient!=-1){
                        let clienteExistente = resClientesOtec[idxClient];
                        clienteExistente.cliente=perfil;
                        clienteExistente.cliente=resClientesOtec[idxClient].cliente.correoPago;
                        mgbUsuariosModel.update({ "cliente.email": perfil.email }, {
                            $set: {
                                "cliente": clienteExistente
                            }
                        }, (errUpdate, docUpdate, resUpdate) => {
                            if (errUpdate == null) {
                                method.respuesta({ perfil: docUpdate.cliente, error: false, mensaje: 'Datos actualizados con exito' })
    
                            } else {
                                method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al actualizar el perfil' })
                            }
                        })
                        //esta cuenta de paypal la está utilizando otro usuario

                    }else{
                        mgbUsuariosModel.update({ "cliente.email": perfil.email }, {
                            $set: {
                                "cliente": perfil
                            }
                        }, (errUpdate, docUpdate, resUpdate) => {
                            if (errUpdate == null) {
                                method.respuesta({ perfil: docUpdate.cliente, error: false, mensaje: 'Datos actualizados con exito' })
    
                            } else {
                                method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al actualizar el perfil' })
                            }
                        })
                    }

                }else{
                    method.respuesta({ perfil: null, error: true, mensaje: 'Hubo un error al actualizar el perfil' })
                }
            })

        },
        verificarPaypal:()=>{
            return new Promise((resolve,reject)=>{
                mgbUsuariosModel.find({},(err,resClientesOtec)=>{
                    if(err==null && resClientesOtec.length>0){
                        let idxClient = _.findIndex(resClientesOtec,(o)=>{
                            return o.cliente.correoPago==perfil.correoPago;
                        })
                        if(idxClient!=-1){
                            console.log('cuenta paypal comprobación no paso');
                            resolve(false);
                        }else{
                            console.log('cuenta paypal comprobación paso');
                            resolve(true);
                        }
                    }else{
                        resolve(true);
                    }
                })
            })
   
        }
  

    }

}

function transaccionPayPal(req, res) {


    try {

        let data = req.body;
        console.log({ transaccionPayPal: data });
        let itemNumber = data.item_number1;
        let comprador = data.payer_email;
        let detailPay = data;
        let status = data.payment_status;

        if (status == 'Completed') {
            console.log('status completed');
            mgbCursosModel.findOne({ "curso.codigoVenta": itemNumber }, (err, resCurso) => {
                if (err == null && resCurso != null) {
                    mgbUsuariosModel.findOne({ "cliente.email": comprador }, (errCli, resCli) => {
                        if (errCli == null && resCli != null) {
    
                            // model inscripcion curso
                            let modelObjectCursoSuscrito = {
                                curso: {
                                    data: resCurso.curso
    
                                },
                                esquema: resCurso.esquema,
                                avances: [],
                                pruebasContestadas: [
    
                                ],
    
    
                                fechaInscripcion: { fecha: moment().format('MMMM Do YYYY, h:mm:ss a') },
                                terminoCurso: {
                                    fecha: ""
                                }
                            }
    
                          
                            if (resCli.cursosSuscrito.length > 0) {
                                console.log("cursos mayor a cero");
                                //verificar Existencia Curso
                                let idxCurso = _.findIndex(resCli.cursosSuscrito, (o) => {
                                    return o.curso.data.codigoVenta == itemNumber;
                                })
                                if (idxCurso == -1) {
                                    resCli.cursosSuscrito.push(modelObjectCursoSuscrito);
    
                                    mgbUsuariosModel.update({ "cliente.email": comprador }, {
                                        $set: {
                                            cursosSuscrito: resCli.cursosSuscrito
                                        }
                                    }, (err, raw) => {
                                        if (err == null) {
                                            //informar al usuario por correo que se inscribio en un curso
    
                                        } else {
                                            // error al inscribir al usuario en un curso
                                        }
                                    })
                                    //inscribir curso por primera vez
    
    
    
                                    //cursoInscrito renombrar
                                } else {
                                    console.log('curso distinto a -1 ');
                                    resCli.cursosSuscrito.splice(idxCurso, 1, modelObjectCursoSuscrito);
    
                                    mgbUsuariosModel.update({ "cliente.email": comprador }, {
                                        $set: {
                                            cursosSuscrito: resCli.cursosSuscrito
                                        }
                                    }, (err, raw) => {
                                        if (err == null) {
                                            //informar al usuario por correo que se inscribio en un curso
    
                                        } else {
                                            // error al inscribir al usuario en un curso
                                        }
                                    })
    
    
    
    
                                }
    
                            } else {
                                resCli.cursosSuscrito.push(modelObjectCursoSuscrito);
                                mgbUsuariosModel.update({ "cliente.email": comprador }, {
                                    $set: {
                                        cursosSuscrito: resCli.cursosSuscrito
                                    }
                                }, (err, raw) => {
                                    if (err == null) {
                                        //informar al usuario por correo que se inscribio en un curso
    
                                    } else {
                                        // error al inscribir al usuario en un curso
                                    }
                                })
                                //inscribir primer curso
                            }
                        } else {
                            //no se encontro al cliente
                            res.status(200).json({ ok: 'ok' });
                        }
                    })
                } else {
                    //no se encontro el curso
                    res.status(200).json({ ok: 'ok' });
                }
            })
            res.status(200).json({ ok: 'ok' });
        }
       




    } catch (e) {
        //notificar al usuario por medio de un correo y a la otec que hubo un error al inscribir el curso
        console.log("tuvimos un problema al inscribir el curso");
        res.status(200).json({ ok: 'ok' });

    }



    /*
    
    try{
        let transaccion=escape(req.body.data);
        /*let config = {
            mode: 'live', // or 'live' 
            username: 'gerencia_api1.otecpausa.cl',
            password: '4FJRYBRX7842DCPT',
            signature: 'ArRCiRalZliId55e11slOihYHtheAJEe7ZA9H.DgWtIhPciSXbENmUWC'
          }

          let paypalgetnvp= paypalnvp(config);
          paypalgetnvp.request('GetBalance',{}).then((result)=>{
            console.log({resultNvp:result});
          }).catch((err)=>{
              console.log({errorNvp:err});
          })*/
    /* console.log({transaccion:transaccion});
     var start_date = "2017-01-01";
     var end_date = "2017-12-12";
     var saleId = "6XM17843J7179532P";
     
       
       paypal.sale.get(transaccion,(error,sale)=>{
         if (error) {
             console.log({errorPaypal:error,salePaypal:sale});
          method.respuesta({pay:null,error:true,mensaje:'El servicio de paypal no esta disponible en este momento.'})
         } else {
             method.respuesta({pay:sale,error:false,mensaje:null})
             console.log(JSON.stringify(sale));
         }
        },(errcall,rescall)=>{
         method.respuesta({pay:null,error:true,mensaje:'Tuvimos un problema al verificar su transacción, intente despues.'})
        })

      /*  paypal.refund.get(transaccion,(error,refund)=>{
            if(error){
             console.log({errorRefund:error});
            }else{
                console.log({stringlify:JSON.stringify(refund)});
             console.log({refund:refund});
            }
        })*/
    /*
        }catch(e){
            method.respuesta({pay:null,error:true,mensaje:'Tuvimos un problema al verificar su transacción, intente despues.'})
        }
        var method= {
            respuesta:(item)=>{
                let strgData = JSON.stringify({ data: { pay:item.pay,error:item.error,mensaje:item.mensaje } });
                crypto.encode(strgData).then((enc) => {
                    res.json({
                        d: enc,
                        success: true
                    })
                })
            }
        
        }
        //let credential= paypal.configure(first_config);
        //console.log({credetial:credential});
        
        */
}

function soapSence() {
    return new Promise((resolve, reject) => {
        var url = 'http://elearningtest.sence.cl/Webservice/SenceElearning.svc?wsdl';
        var args = { name: 'value' };
        soap.createClient(url, function (err, client) {
            console.log({ err: err, client: client });
            client.RegistrarActividad({ codigoSence: "1234630719", rutAlumno: "17975763", claveAlumno: "FR450263", rutOtec: "158100754", claveOtec: "pausa2017", estadoActividad: "1" }, function (err, result) {
                console.log({ soapConsulte: result });
            });
        });
    })
}

function getbotones(req, res) {
    try {
        let data = req.body.data;
        let identificador = req.body.IdentificadorApp;
        mgbfrontPageModel.findOne({ "identificador.key": identificador }, (err, resBtn) => {

            if (err == null) {
                console.log({ resbotones: resBtn });
                method.respuesta({ btns: resBtn.botonesPago, error: false, mensaje: null });
            } else {
                method.respuesta({ btns: resBtn.botonesPago, error: true, mensaje: 'No hay registros' });
            }
        })
        console.log({ getBotones: req.body });
    } catch (e) {
        method.respuesta({ btns: [], error: true, mensaje: 'No se pudo concretar la solicitud' });
    }
    var method = {
        respuesta: (item) => {
            let strgData = JSON.stringify({ data: { btns: item.btns, error: item.error, mensaje: item.mensaje } });
            crypto.encode(strgData).then((enc) => {
                res.json({
                    d: enc,
                    success: true
                })
            })
        }

    }
}

function ventaCursos(req, res) {
    try {
        let identificador = req.body.IdentificadorApp;
        console.log({ identificadorApp: req.body.data.identificadorApp });
        console.log({ reqVentacursos: req.body });
        let data = req.body.data;
        let body = req.body;
        console.log({ dataDelGordo: body.IdentificadorApp });
        mgbpeticionesCurso.find({ "identificador": identificador }, (err, resPeticion) => {
            if (resPeticion.length == 0) {
                let guardPeticion = new mgbpeticionesCurso();
                let peticion = [data];
                guardPeticion.peticiones = peticion;
                guardPeticion.concretadas = [];
                guardPeticion.identificador = identificador;
                guardPeticion.save((error, guard) => {
                    if (error) {
                        res.status(500).json({ message: 'hubo un error en la peticion' });
                    } else {
                        if (!guard) {
                            res.status(500).json({ message: 'hubo un error al guardar el curso' });
                        } else {
                            let strgData = JSON.stringify({ data: { send: true, mdate: "Nos pondremos en contacto con usted", type: "success", summ: "Exito" } });

                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true
                                })
                            })
                        }
                    }
                })
            } else {
                console.log({ resPeticionMamm: resPeticion });
                let __indexDocumento = _.findIndex(resPeticion, function (o) { return o.identificador == identificador; });
                let documento = resPeticion[__indexDocumento];
                let index = _.findIndex(documento.peticiones, function (o) { return o.u.usuario == data.u.usuario; })
                if (index != -1) {
                    let strgData = JSON.stringify({ data: { send: true, mdate: "Su peticion ya fue cursada espere la respuesta", type: "info", summ: "Información" } });

                    crypto.encode(strgData).then((enc) => {
                        res.json({
                            d: enc,
                            success: true
                        })
                    })
                } else {
                    documento.peticiones.push(data);
                    mgbpeticionesCurso.update({ "_id": documento._id }, {
                        $set: {
                            "peticiones": documento.peticiones,
                            "identificador": identificador
                        }
                    }, (err, raw) => {
                        if (err == null) {
                            let strgData = JSON.stringify({ data: { send: true, mdate: "Nos pondremos en contacto con usted", type: "success", summ: "Exito" } });

                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true
                                })
                            })
                        } else {
                            let strgData = JSON.stringify({ data: { send: true, mdate: "Vuelva a intentarlo mas tarde", type: "error", summ: "Error" } });

                            crypto.encode(strgData).then((enc) => {
                                res.json({
                                    d: enc,
                                    success: true
                                })
                            })
                        }
                    })
                }
            }
        })
    } catch (e) {
        let strgData = JSON.stringify({ data: { send: true, mdate: "Vuelva a intentarlo mas tarde", type: "error", summ: "Error" } });

        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success: true
            })
        })
    }


}

function _v_alumno(req, res) {

    //console.log({bodyVerificAlumno:req.body.data});
    // soapSence()
    let strgData = JSON.stringify({ data: { verif: true, mess: "El usuario no existe en la base de datos" } });

    crypto.encode(strgData).then((enc) => {
        res.json({
            d: enc,
            success: true
        })
    })
}



function getCursos(req, res) {
    try {
        mgbCursosModel.find({}, (err, arrCurso) => {
            console.log({ getCursos: arrCurso });
            if (arrCurso.length > 0 && err == null) {
                let cursos = [];
                arrCurso.forEach((curso, index) => {
                    if (curso.activo == true) {
                        cursos.push(curso);
                    }
                })
                let strgData = JSON.stringify({ data: { cursos: cursos } });

                crypto.encode(strgData).then((enc) => {
                    res.json({
                        d: enc,
                        success: true
                    })
                })
            } else {
                let strgData = JSON.stringify({ data: { cursos: [] } });
                crypto.encode(strgData).then((enc) => {
                    res.json({
                        d: enc,
                        success: true
                    })
                })
            }

        })

    } catch (e) {
        let strgData = JSON.stringify({ data: { cursos: [] } });
        crypto.encode(strgData).then((enc) => {
            res.json({
                d: enc,
                success: true
            })
        })
    }


}

module.exports = app;

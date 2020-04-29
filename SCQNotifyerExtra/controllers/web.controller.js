// web.controller.js

// Cargamos el schema del modelo de datos para poder usarlo dentro de la lógica del controlador
// y así poder añadir, borrar, etc. sobre productos.
//const Usuario = require('../models/usuarios.model');

// Carga de módulos necesarios:

const { Usuario } = require("../models/usuarios.model");
const { Incidencia } = require("../models/usuarios.model");
const { Ayuntamiento } = require("../models/usuarios.model");
const nodemailer = require('nodemailer');
const request = require('request');


///////// FUNCIONES ////////////////


// pruebas
exports.web_pruebas = function (req, res) {
  res.render('pruebas', { titulo: 'SCQN - Pruebas' });
};

// raíz
exports.web_raiz = function (req, res) {
  res.render('index', { "titulo": "SCQN - Notificador incidencias" });
};

//info
exports.web_info = function (req, res) {
  res.render('info', { "titulo": "SCQN - Información" });
};

// Login
exports.web_login = function (req, res) {
  res.render("login", { "titulo": "SCQN - Acceso a la aplicación" });
}

// Loginx GET
exports.web_loginx = function (req, res) {
  console.log(req.query);
  res.end(`Nombre: ${req.query.first_name} - ID de Telegram: ${req.query.id}`);
  // res.end("Consulte los datos en consola.");
}

// Loginx POST
exports.web_loginxPOST = function (req, res) {

  // Recibe datos de peticion ajax del login tipo "callback" y crea la sesión y devuelve ok.
  // En la sesión ponemos las mismas propiedades de Telegram.
  session = req.session;
  session.cliente = {};
  session.cliente.id = req.body.id;
  session.cliente.first_name = req.body.first_name;
  session.cliente.last_name = req.body.last_name;
  session.cliente.username = req.body.username;

  if (req.body.notificaciones != null) {
    session.cliente.notificar = req.body.notificaciones;
  } else {
    session.cliente.notificar = true;
  }

  // nombre: {type: String, required: true, max: 50},
  // apellidos: {type: String, required: false, max: 100},
  // username: {type: String, required: false, max: 50, default: ''},
  // telegram_id: {type: String, required: true, max: 50},
  // solucionador: {type: Boolean, required: true, default: '0'},
  // notificaciones: {type: Boolean, required: true, default: '1'},
  // incidencias: incidenciaSchema

  // foto: {type: String, required: true, max: 120},
  //  latitud: {type: String, required: true, max: 20},
  //  longitud: {type: String, required: true, max: 20},
  //  texto_inc: {type: String, required: true, max: 254},
  //  resuelta: {type: Boolean, required: false, default: '0'},
  //  texto_res: {type: String, required: false, max: 255}

  if ('last_name' in req.body)
    session.cliente.last_name = req.body.last_name;
  else
    session.cliente.last_name = '';

  session.cliente.auth_date = req.body.auth_date;


  // Ahora comprueba si usuario está dado de alta en la base de datos.Devuelve true o false.
  Usuario.exists({ telegram_id: req.body.id }, function (err, encontrado) {
    if (err) {
      res.send({ status: "error", data: "No se puede procesar la entidad, datos incorrectos!" });
    }
    else {
      if (!encontrado) // No lo encontró entonces lo da de alta.
      {


        let usuario = new Usuario(
          {
            nombre: req.body.first_name,
            apellidos: session.cliente.last_name,
            username: req.body.username,
            telegram_id: req.body.id



          });

        // PETICIÓN A LA BASE: 
        // Aquí hago una petición a la Base de Datos de MongoDB para sacar los datos que se crean automáticamente como DEFAULT: 
        // De sta forma puedo utilizarla más tarde a la hora de editar el perfil: 
        /*
        usuario.find({ telegram_id: req.session.cliente.id }, function (err, docs) {
          if (docs != 0) {
            // No hace falta añadirlo porque ya son defaults, así que solo los guardamos en
            // sesion.cliente.
          } else {
            console.log("No se pudo encontrar el usuario al hacer una petición a la base de datos - Web.controler.js - lin 107");
          }
          
        });
        */


        // Programado con una promise.
        usuario.save().then(function () {
          if (err) {
            /* Si se ha producido un error, salimos de la función devolviendo  código http 422 (Unprocessable Entity).*/
            res.type('json').status(422).send({ status: "error", data: err });
          }
          else
            /* Enviamos al cliente la siguiente respuesta con el código HTTP 200. */
            res.type('json').status(200).send({ status: "ok", data: "Usuario logueado y registrado.!" });
        });
      }
      else
        res.type('json').status(200).send({ status: "ok", data: "Usuario logueado y registrado.!" });
    }
  })
}


// Desconexión
exports.web_desconectar = function (req, res) {
  session = req.session;
  session.destroy(function (err) {
    if (err)
      res.end("Error destruyendo sesion");
    else {
      //Enviamos redireccion
      res.writeHead(307, { Location: "/" }); // La redirección 301 es permanente, la 302 es temporal junto a la 307 y a la 308 (creo)
      res.end();
    }
  });
}

/////////////// FUNCIONES EN RUTAS PRIVADAS ///////////////

// Incidencias
exports.web_incidencias = async function (req, res) {
  let arrayIncidencias = [];
  // let usernames = [];
  await Usuario.find({}, function (err, res) {

    // Para que saque varios usuarios...
    console.log("RESPUESTA DE INCIDENCIAS");
    for (var i = 0; i < res.length; i++) {
      console.log(res[i].incidencias);
      // usernames.push(res[i].username);
      for (var z = 0; z < res[i].incidencias.length; z++) {
        arrayIncidencias.push(res[i].incidencias[z]);
        arrayIncidencias.push(res[i].username);
      }
    }

    console.log("Array de incidencias");
    console.log(arrayIncidencias);
    // arrayIncidencias = res[2].incidencias;
    // username = res[2].username;
  });



  res.render("incidencias", { "titulo": "SCQN - Página de incidencias", "datos": arrayIncidencias });
}

// Mapa
exports.web_mapa = async function (req, res) {
  // Coger la info de los usuarios y las incidencias y colocarlas con marcadores en el mapa

  // 1. Hago un Usuario.find
  let arrayIncidencias = [];
  await Usuario.find({}, function (err, res) {
    for (var i = 0; i < res.length; i++) {
      console.log(res[i].incidencias);
      // usernames.push(res[i].username);
      for (var z = 0; z < res[i].incidencias.length; z++) {
        arrayIncidencias.push(res[i].incidencias[z]);
        arrayIncidencias.push(res[i].username);
      }
    }
  });

  res.render("mapa", { "titulo": "SCQN - Mapa de incidencias", "incidencias": arrayIncidencias });
}

// Meteo
exports.web_meteo = function (req, res) {
  res.render("meteo", { "titulo": "SCQN - Meteo", info: null, error: null });
}

// Mis incidencias
exports.web_misincidencias = async function (req, res) {
  let arrayIncidencias = null;
  await Usuario.find({ telegram_id: session.cliente.id }, function (err, res) {
    arrayIncidencias = res[0].incidencias;
  });

  console.log("MIS INCIDENCIAS");
  console.log(arrayIncidencias);

  res.render("misincidencias", { "titulo": "SCQN - Mis incidencias", "misIncidencias": arrayIncidencias });
}

// Perfil 
exports.web_perfil = function (req, res) {

  // PETICIÓN A LA BASE: 
  // Aquí hago una petición a la Base de Datos de MongoDB para sacar los datos que se crean automáticamente como DEFAULT: 
  // De esta forma puedo utilizarla más tarde a la hora de editar el perfil: 
  Usuario.find({ telegram_id: session.cliente.id }, function (err, docs) {
    if (err) {
      res.send({ status: "error", data: "No se puede procesar la prim." });
    } else if (docs != 0) {
      // No hace falta añadirlo porque ya son defaults, así que solo los guardamos en
      // sesion.cliente.

      session.cliente.first_name = docs[0].nombre;
      session.cliente.last_name = docs[0].apellidos;
      session.cliente.email = docs[0].email;
      session.cliente.solucionar = docs[0].solucionar;
      session.cliente.notificar = docs[0].notificaciones;
      session.cliente.incidencias = docs[0].incidencias;

      console.log("Defaults añadidos");
      console.log(docs[0]);
      res.render("perfil", { "titulo": "SCQN - Perfil del usuario", datos: docs[0] });
      //res.type("json").status(200).send({status: "ok", data: "Los nuevos datos han sido añadidos."});
    } else {
      console.log("No se pudo encontrar el usuario al hacer una petición a la base de datos - Web.controler.js - lin 189");
    }
  });
}

// Info de Telegram
exports.web_infotelegram = function (req, res) {

  var arrayInfoTelegram = [session.cliente.id, session.cliente.username, session.cliente.first_name, session.cliente.last_name, session.cliente.email];

  res.render("infotelegram", { "titulo": "SCQN - Información de Telegram", "infoTelegram": arrayInfoTelegram });
}

exports.web_edicion = async function (req, res) {
  // Aquí es donde tengo que hacer una petición a la Base de Datos: 
  session = req.session;
  console.log("REQ BODY: ");
  console.log(req.body);
  await Usuario.find({ telegram_id: session.cliente.id }, async function (err, docs) {
    id = docs[0]._id;

    // camposObjeto = qs.parse(req.body);
    await Usuario.findByIdAndUpdate(id, { $set: req.body }, function (err, res) {
      if (res) {

        // PREGUNTAR A RAFA POR QUÉ AQUÍ NO SE CAMBIAN Y SIN EMBARGO MÁS ARRIBA SÍ.
        session.cliente.first_name = req.body.nombre;
        session.cliente.last_name = req.body.apellidos;
        session.cliente.email = req.body.email;
        session.cliente.notificar = req.body.notificar;
        console.log("Actualizado - lin. 216");
      } else {
        console.log("Hubo un error a la hora de actualizar los datos de la base de datos: " + err);
        alert("Hubo un error a la hora de actualizar la BD");
      }
    });
    res.render("perfil", { "titulo": "SCQN - Perfil del usuario", datos: docs[0] });
  });
}

exports.web_infoMeteo = function (req, res) {
  // METEO.JS -----
  console.log("-----METEO POST EDITION YEAH-----");

  // Cargamos el módulo request.
  const request = require('request');

  // Definimos nuestra API KEY
  const apiKey = 'd325c87c7d20bc779e1dcc9f8d5b99d3';

  console.log("Antes del post...");
  // Asignamos a ciudad el parámetro recibido por POST que tenemos en req.body.ciudad
  let ciudad = req.body.ciudad;
  let unidad = 'metric';
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=${unidad}`;
  console.log("Antes del request...");
  request(url, function (err, response, body) {
    if (err) {
      console.log("Error");
      // res.render('/meteo', { info: null, error: 'Error, please try again' });
      res.type("json").status(400).send({ info: null, status: "error", data: "Error, please try again." });
    } else {
      let info = JSON.parse(body);
      if (info.main == undefined) {
        console.log("Undefined");
        // res.render('/meteo', { info: null, error: 'Error, please try again' });
        res.type("json").status(404).send({ info: null, status: "error", data: "Error, please try again." });
      } else {
        let infoTexto = `Información sobre <strong>${info.name}</strong><br/>`;
        infoTexto += `Méteo actual:<br/>`;
        infoTexto += `<img src='http://openweathermap.org/img/wn/${info.weather[0].icon}@2x.png' alt='${info.weather[0].description}'/><br/>`;

        infoTexto += `Coordenadas (latitud,longitud): <strong>(${info.coord.lat},${info.coord.lon})</strong>.<br/>`;
        infoTexto += `Temperatura actual: <strong>${info.main.temp}ºC</strong>.<br/>`;
        infoTexto += `Sensación térmica: <strong>${info.main.feels_like}ºC</strong>.<br/>`;
        infoTexto += `Temperatura mínima: <strong>${info.main.temp_min}ºC</strong>.<br/>`;
        infoTexto += `Temperatura máxima: <strong>${info.main.temp_max}ºC</strong>.<br/>`;
        infoTexto += `Presión atmosférica: <strong>${info.main.pressure}</strong>.<br/>`;
        infoTexto += `Velocidad del viento: <strong>${info.wind.speed} Km/h</strong>.<br/>`;
        infoTexto += `Dirección del viento: <strong>${info.wind.deg}</strong>.<br/>`;

        // Conversión de hora en formato Unix a hh:mm
        var date = new Date(info.sys.sunrise * 1000);
        var minutos = "0" + date.getMinutes();
        var horaAmanecer = date.getHours() + ':' + minutos.substr(-2);

        var date = new Date(info.sys.sunset * 1000);
        var minutos = "0" + date.getMinutes();
        var horaPuesta = date.getHours() + ':' + minutos.substr(-2);

        infoTexto += `Hora amanecer: <strong>${horaAmanecer}</strong>.<br/>`;
        infoTexto += `Hora puesta de sol: <strong>${horaPuesta}</strong>.<br/>`;
        infoTexto += `Humedad: <strong>${info.main.humidity}%</strong>.<br/>`;

        console.log("INFO: ");
        console.log(info);

        console.log("_________________________________");
        console.log("INFO TEXTO: ");
        console.log(infoTexto);

        // En vez de esto, enviar un json
        // res.render('/meteo', { info: infoTexto, error: null });
        res.type("json").status(200).send({ info: infoTexto, status: "ok", data: "Devolviendo la información." });
      }
    }
  });
}

exports.web_guardarIncidencias = function (req, res) {
  console.log("INCIDENCIA EN GUARDADO");
}

exports.web_resolverIncidencias = async function (req, res) {
  let arrayIncidencias = [];
  await Usuario.find({}, function (err, res) {
    for (var i = 0; i < res.length; i++) {
      console.log(res[i].incidencias);
      // usernames.push(res[i].username);
      for (var z = 0; z < res[i].incidencias.length; z++) {
        arrayIncidencias.push(res[i].incidencias[z]);
        arrayIncidencias.push(res[i].username);
      }
    }
  });

  res.render("resolverIncidencias", { "titulo": "SCQN - Resolución de incidencias", "datos": arrayIncidencias });
}

exports.web_formularioResolucion = function (req, res) {
  res.render("formularioResolucion", { "titulo": "SCQN - Formulario de resolución" });
}

exports.web_formularioResolucionPOST = async function (req, res) {
  // Aquí dentro, buscar la incidencia correspondiente con el texto_inc enviado y cambiarla
  // console.log("FORMULARIO RESOLUCIÓN POST");
  let idIncidencia = req.body.id;
  let texto_res = req.body.texto_res;

  let correoUsuario = null;
  let texto_incIncidencia = null;


  await Usuario.find({}, function (err, res) {

    arrayUsuarios = res;

    // console.log("Array de incidencias de usuario:");
    // console.log(arrayUsuarios);

    for (var i = 0; i < arrayUsuarios.length; i++) {
      arrayIncidencias = arrayUsuarios[i].incidencias;

      // console.log("Array de incidencias");
      // console.log(arrayIncidencias);

      for (var z = 0; z < arrayIncidencias.length; z++) {
        if (arrayIncidencias[z]._id == idIncidencia) {
          res[i].incidencias[z].texto_res = texto_res;
          res[i].incidencias[z].resuelta = true;

          res[i].save((error) => {
            console.log("CONSOLA DE ERRORES: ");
            if (error != null)
              console.log(error);
            else
              console.log("No hay error");
          });

          if (session.cliente.notificar == true) {

            correoUsuario = res[i].email;
            texto_incIncidencia = res[i].incidencias[z].texto_inc;

            // Enviar correo y mensaje por el bot
            // bot.telegram.sendmessage("Su incidencia " + res[i].incidencias[z]._id + " ha sido resuelta.");
            console.log("CORREO DEL USUARIO");
            console.log(correoUsuario);

            if (correoUsuario != "" && correoUsuario != null) {

              var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'a19andresaa@iessanclemente.net',
                  pass: 'Aloalvand19999'
                }
              });

              var mailOptions = {
                from: 'a19andresaa@iessanclemente.net',
                to: correoUsuario,
                subject: 'Tu incidencia ha sido resuelta',
                text: "Tu resolución, que empieza con: " + texto_incIncidencia.substring(0, 20) +
                  "... ha sido resuelta, puedes acceder a la resolución en nuestra web."
              };

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            }

            /*
             -- Como enviar el mensaje por el bot: 
              - Hacer petición a una url del bot, mandándole el id de la incidencia. (Con un request);
            */

            bot.telegram.sendMessage(res[i].telegram_id, "Tu incidencia, que empieza con: " + texto_incIncidencia.substring(0, 20) + "... ha sido resuelta, puedes acceder a la resolución en nuestra web");
          }
          break;
        }
      }
    }
  });

  console.log("Incidencia resuelta");
  res.type("json").status(200).send({ status: "ok", data: "Devolviendo la información." });
}

exports.web_editarIncidencias = async function (req, res) {
  var texto_inc = req.url.split("texto_inc=")[1].split("%20").join(" ");

  console.log(texto_inc);
  /* 
  let arrayIncidencias = null;
  let idIncidencia = req.body.id;
  let incidenciaAEditar = null;
  await Usuario.find({ telegram_id: session.cliente.id }, function (err, res) {
    arrayIncidencias = res[0].incidencias;
    for (var i = 0; i < arrayIncidencias.length; i++) {
      if (arrayIncidencias[i]._id == idIncidencia) {
        incidenciaAEditar = arrayIncidencias[i];
        break;
      }
    }
  });
  console.log("EDICIÓN DE INCIDENCIAS");
  console.log(incidenciaAEditar);
  */
  res.render("editarIncidencias", { "titulo": "SCQN - Resolución de incidencias", "texto_inc": texto_inc });
}

exports.web_editarIncidenciasPOST = async function (req, res) {
  let idIncidencia = req.body.id;
  let texto_inc = req.body.texto_inc;

  await Usuario.find({ telegram_id: session.cliente.id }, function (err, res) {
    arrayIncidencias = res[0].incidencias;
    console.log("Array Incidencias");
    console.log(arrayIncidencias);


    for (var i = 0; i < arrayIncidencias.length; i++) {
      if (arrayIncidencias[i]._id == idIncidencia) {
        res[0].incidencias[i].texto_inc = texto_inc;

        res[0].save((error) => {
          console.log("CONSOLA DE ERRORES: ");
          if (error != null)
            console.log(error);
          else
            console.log("No hay error");
        });

        // Enviar correo y mensaje por el bot
        // bot.telegram.sendmessage("Su incidencia " + res[i].incidencias[z]._id + " ha sido resuelta.");

        /*
         -- Como enviar el mensaje por el bot: 
          - Hacer petición a una url del bot, mandándole el id de la incidencia. (Con un request);
        */

        break;
      }
    }
  });
  res.type("json").status(200).send({ status: "ok", data: "Los datos han sido modificados." });
}

exports.web_borrarIncidencias = async function (req, res) {
  let idIncidencia = req.url.split("id=")[1];
  let idUsuario = null;
  let arrayIncidencias = null;

  await Usuario.find({ telegram_id: session.cliente.id }, function (err, res) {
    arrayIncidencias = res[0].incidencias;
    idUsuario = res[0]._id;

    for (var i = 0; i < arrayIncidencias.length; i++) {
      if (arrayIncidencias[i]._id == idIncidencia) {
        res[0].incidencias.splice(i, 1);
        arrayIncidencias = res[0].incidencias;

        res[0].save((error) => {
          console.log("CONSOLA DE ERRORES: ");
          if (error != null)
            console.log(error);
          else
            console.log("No hay error");
        });

        break;
      }
    }
  });
  res.render("misincidencias", { "titulo": "SCQN - Resolución de incidencias", "misIncidencias": arrayIncidencias });
}

exports.web_cancelarCuenta = async function (req, res) {
  await Usuario.find({ telegram_id: session.cliente.id }, function (err, res) {
    res[0].remove((error) => {
      console.log("CONSOLA DE ERRORES: ");
      if (error != null) {
        console.log(error);
      } else {
        console.log("No hay error");
      }
    });
  });
  res.writeHead(307, { Location: "/desconectar" }); // La redirección 301 es permanente, la 302 es temporal junto a la 307 y a la 308 (creo)
  res.end();
  res.render('index', { "titulo": "SCQN - Notificador incidencias" });
}

exports.web_altaAyuntamientos = function (req, res) {
  res.render("altaAyuntamientos", { "titulo": "SCQN - Admin - Alta de Ayuntamientos" });
}

exports.web_altaAyuntamientosPOST = async function (req, res) {
  var nombreAyuntamiento = req.body.nombre;

  await Ayuntamiento.exists({ nombre: nombreAyuntamiento }, function (err, encontrado) {
    if (err) {
      res.send({ status: "error", data: "No se puede procesar la entidad, datos incorrectos!" });
    } else {
      if (!encontrado) { // No lo encontró entonces lo da de alta.
        let ayuntamiento = new Ayuntamiento(
          {
            nombre: req.body.nombre,
            email: req.body.email,
            municipio: req.body.municipio,
            codigoRegistroAgentes: req.body.codigoRegistroAgentes,
            codigoINE: req.body.codigoINE
          });

        ayuntamiento.save().then(function () {
          if (err) {
            /* Si se ha producido un error, salimos de la función devolviendo  código http 422 (Unprocessable Entity).*/
            res.type('json').status(422).send({ status: "error", data: err });
          } else {
            /* Enviamos al cliente la siguiente respuesta con el código HTTP 200. */
            res.type('json').status(200).send({ status: "ok", data: "Ayuntamiento registrado!" });
          }
        });
      } else {
        res.type('json').status(200).send({ status: "ok", data: "Ayuntamiento registrado.!" });
      }
    }
  });
}

/*
exports.web_resolverIncAgente = async function (req, res) {
  let arrayIncidencias = [];
  let primerRes = res;
  let promises = [];
  Usuario.find({}, async function (err, res) {
    for (var i = 0; i < res.length; i++) {
      // console.log(res[i].incidencias);
      // usernames.push(res[i].username);
      var length = res[i].incidencias.length;
      for (var z = 0; z < length; z++) {
        // console.log("Otra incidencia... \n");
        var arrayIncidencias = [];
        arrayIncidencias.push(res[i].incidencias[z]);

        var arrayUsuarios = [];
        arrayUsuarios.push(res[i].username);


      }
    }
  });
  console.log("ARRAY DE INCIDENCIAS ANTES DE HACER EL RENDER");
  console.log(arrayIncidencias);
  res.render('resolucionIncAgentes', { "titulo": "SCQN - Agentes - Resolución de incidencias", "datos": arrayIncidencias });
}
*/


exports.web_resolverIncAgente = async function (req, res) {
  let arrayIncidencias = [];
  let primerRes = res;
  let promises = [];
  buscarIncidencias(arrayIncidencias, primerRes);
  setTimeout(function() {
    // console.log("ARRAY DE INCIDENCIAS ANTES DE HACER EL RENDER");
    // console.log(arrayIncidencias);
    primerRes.render('resolucionIncAgentes', { "titulo": "SCQN - Agentes - Resolución de incidencias", "datos": arrayIncidencias });
  },1500);
}

function buscarIncidencias(arrayIncidencias, primerRes) {
  var array = arrayIncidencias;
  Usuario.find({}, async function (err, res) {
    for (var i = 0; i < res.length; i++) {
      var length = res[i].incidencias.length;
      for (var z = 0; z < length; z++) {
        // console.log("Otra incidencia... \n");
        var incidenciaActual = res[i].incidencias[z];
        var usuarioActual = res[i].username;
        hacerRequest(incidenciaActual, usuarioActual, incidenciaActual.latitud, incidenciaActual.longitud, array);
      }
    }
    
  });
}

function hacerRequest(incidenciaActual, usuarioActual, latitud, longitud, arrayIncidencias) {
  request("https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&facet=municipio&geofilter.distance=" + latitud + "%2C+" + longitud, async function (err, requestRES, body) {
    if (err) {
      console.log(err);
    } else {
      var cuerpo = JSON.parse(body);
      var municipio = cuerpo.records[0].fields.municipio;
      // console.log("MUNICIPIO: ");
      // console.log(municipio);

      await Ayuntamiento.find({ nombre: municipio }, function (err, res) {
        // Si el ayuntamiento tiene como agente al usuario logueado, entonces puede resolver esa incidencia, la añadimos al array de incidencias
        if (typeof res[0] !== 'undefined') {
          var agentesAyuntamiento = res[0].agentes;
          // console.log("AGENTES DEL MUNICIPIO. ");
          // console.log(agentesAyuntamiento);

          // console.log("Es igual?");
          // console.log(agentesAyuntamiento[0] + " = " + session.cliente.id);
          for (var c = 0; c < agentesAyuntamiento.length; c++) {
            if (agentesAyuntamiento[c] == session.cliente.id) {
              arrayIncidencias.push(incidenciaActual);
              arrayIncidencias.push(usuarioActual);
              // console.log("ARRAY DE INCIDENCIAS MODIFICANDOSE...");
              // console.log(arrayIncidencias);
              break;
            }
          }
        }
      });
    }
  });
}

////////////////////////////////////////////
/////////////////// MONGO //////////////////
////////////////////////////////////////////



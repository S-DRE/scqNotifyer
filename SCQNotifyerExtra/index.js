
// Carga de módulos
const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const request = require('request')
const bodyParser = require('body-parser');
const path = require('path');
const uniqueFilename = require('unique-filename');
const engine = require('ejs-blocks');
const { Usuario } = require("./models/usuarios.model");
const { Incidencia } = require("./models/usuarios.model");
const { Ayuntamiento } = require("./models/usuarios.model");
const nodemailer = require('nodemailer');

// Leemos el fichero de entorno .env
dotenv.config();

// Configuramos los certificados SSL para HTTPS
const privateKey = fs.readFileSync('/etc/letsencrypt/live/a19andresaa.mywire.org/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/a19andresaa.mywire.org/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/a19andresaa.mywire.org/chain.pem', 'utf8');

const credenciales = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

// Creamos una instancia del módulo express
const app = express()

// Configuramos la app para que use el motor de plantillas EJS.
// Usamos el motor ejs-blocks que nos permitirá usar bloques con EJS.
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Rutas para favicon, public, css y js.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));

// Hacemos uso del módulo bodyParser
app.use(bodyParser.urlencoded({ extended: true }));


// Uso de cookies
app.use(cookieParser());

// Uso de sesiones
app.use(session({
    secret: "ElSecretoDeLaRiva",
    resave: true,
    saveUninitialized: true,
    cookie: { // <-- La cookie va del lado del cliente, por lo que aunque reiniciemos el Nodemon/Node, se guarda. Pero la sesión a la que apunta no, pues está del lado del servidor.
        path: "/",
        httpOnly: true,
        maxAge: 1800000, // <-- 30 Minutos en milisegundos
        sameSite: true
    },
    rolling: true
}));

////////////////////////////////////////////
////////////// MIDDLEWARE //////////////////
////////////////////////////////////////////

const LoggerMiddleware = (req, res, next) => {
    console.log(`Página accedida: ${req.url} ${req.method}.`);
    next();
} // FIN DEL MIDDLEWARE
// app.use("/login", LoggerMiddleware);

const usuarioConectado = (req, res, next) => {
    // Comprueba si hay una variable de sesión creada, si es así crea una variable global
    // Llamada "cliente" que se pueda usar en todas las vistas.
    // De esa forma podremos comprobar en las vistas si el cliente estña autenticado con el 
    // lenguaje de vistas.

    cliente = req.session.cliente || null;
    // console.log(cliente);
    next();
}

// Activamos el middleware para todas las rutas.
app.use(usuarioConectado);

////////////////////////////////////////////
//////////////// RUTAS /////////////////////
////////////////////////////////////////////

// Rutas para la web en routes/web.routes.js
const web = require('./routes/web.routes');
app.use('/', web);


////////////////////////////////////////////
//////////////// MONGO /////////////////////
////////////////////////////////////////////

const opcionesMongo = {
    keepAlive: 1,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
};

var mongoose = require('mongoose');

var mongoDB = 'mongodb://pruebasSCQ:abc123.@127.0.0.1:27017/SCQNotifyer';

mongoose.connect(mongoDB, opcionesMongo).catch(error => { console.log('No me puedo conectar al servidor MongoDB: ' + error) });

mongoose.connection.on('error', error => { console.log('Se ha producido un error en conexión a MongoDB: ' + error) });
mongoose.connection.on('connected', () => { console.log('Conectado a servidor MongoDB.') });


// Arrancamos el servidor http....Acordarse de parar Nginx ya que trabajamos con puerto 80 y 443 (necesario autenticación contra dominio en Telegram)
// Puerto para el bot de Telegram 8443.
const httpServer = http.createServer(credenciales, app);
var server = httpServer.listen(process.env.PUERTO_WEB_HTTP, () => {
    console.log(`Servidor http funcionando en puerto ${process.env.PUERTO_WEB_HTTP}`);
});

// Arrancamos el servidor https....Acordarse de parar Nginx.
const httpsServer = https.createServer(credenciales, app);
var server = httpsServer.listen(process.env.PUERTO_WEB_HTTPS, () => {
    console.log(`Servidor https funcionando en puerto ${process.env.PUERTO_WEB_HTTPS}`);
});


const expressApp = express();

// Leemos el fichero de entorno .env
dotenv.config();

// Creamos el objeto Telegraf
bot = new Telegraf(process.env.BOT_TOKEN);

// Ajustamos el Webhook (necesario hacer solamente 1 vez o cuando cambie la URL/puerto de nuestro servidor)
// Esta linea la ejecutamos 1 vez y la comentamos: 
// bot.telegram.setWebhook(process.env.WEBHOOK_URL + ':' + process.env.PUERTO + process.env.WEBHOOK_CARPETA_SECRETA);

// Ajustamos la ruta en Express, que gestionará las peticiones que recibimos desde Telegram en el bot.
app.use(bot.webhookCallback(process.env.WEBHOOK_CARPETA_SECRETA));


// Prueba de servicio web, comentar despues...
expressApp.get("/", (req, res) => {
    res.send("Hola, que tal?");
});


/////////////////////////////////////////
/////////// COMANDOS DEL BOT ////////////
/////////////////////////////////////////

// Mensaje de bienvenida:

let estado = 0;

if (estado == 0) {
    bot.start((ctx) => {
        ctx.reply('Bienvenido al bot SCQNotifyer, estamos disponibles para lo que tu quieras, cuando tu quieras.')
    });

    // Antiguo token 1008095139:AAFBamJTD1-X3u7dUP-qRx1Buytaeq6J0ZY

    // Programamos la lista de comandos y eventos del bot:

    bot.hears(["hola", "Hola"], (ctx => {
        ctx.replyWithHTML(`Hola!`);
    }));

    // Versión mejorada...
    bot.hears("Buenas", (ctx => {
        ctx.replyWithHTML(`Hola <b>${ctx.from.first_name}</b>, ¿Qué tal estás meu?\nTu ID en Telegram es: <b>${ctx.message.from.id}</b>\n\nTu username es: <b>${ctx.message.from.username}</b>`)
    }));

    // Escuchar las incidencias
    bot.hears("Iniciar Incidencia", (ctx => {
        ctx.replyWithHTML(`Hola <b>${ctx.from.first_name}</b>, ¿Qué ha pasado meu?`);
    }));

    // Versión borde
    bot.hears("ok", ctx => {
        ctx.reply('👍');
    });


    /* 
        INICIAR Y FIN DE INCIDENCIAS: 
        Habría que enviar todo lo necesario, y después subirlo a la Base de Datos, 
        por lo que el bot debe de escuchar las 3 cosas requeridas mientras tanto
    */


    bot.command("inicioincidencias", (ctx) => {
        let textoIncidencia = null;
        let fotoIncidencia = null;
        let longitudIncidencia = null;
        let latitudIncidencia = null;

        idUsuario = ctx.message.from.id;

        console.log("ID DEL USUARIO: ");
        console.log(idUsuario);

        ctx.replyWithHTML("Por favor envíe una ubicación, una foto y un texto");

        // var incidencia = {foto: "",texto: "",ubicacion: ""};

        estado = 1;
        var contador = 0;
        var numero;

        bot.on("text", (ctx) => {
            contador++;
            numero = 4 - contador;
            // bot.telegram.sendMessage(msg.chat.id, `Texto recibido. Te queda enviar <b>` + 5 - contador + `</b> cosa/s más.`);
            ctx.replyWithHTML("Texto recibido. Te queda enviar <b>" + numero + "</b> cosa/s más.");
            estado = 1;
            textoIncidencia = ctx.message.text;
            guardarIncidencias(ctx);
        }); // Iniciar incidencia

        bot.on("photo", (ctx) => {
            contador++;
            numero = 4 - contador;

            let urlInfoFichero = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${ctx.message.photo[ctx.message.photo.length - 1].file_id}`;

            ctx.replyWithHTML("..");
            request(urlInfoFichero, function (err, response, body) {
                body = JSON.parse(body);


                let urlDescargaFichero = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${body.result.file_path}`;

                // Generamos un nombre único para ese fichero, para poder guardar en /descargas

                let nombreFinalFichero = uniqueFilename("./public/descargas/") + '.' + body.result.file_path.split('.').pop();

                descargarFichero(urlDescargaFichero, nombreFinalFichero, function () {
                    estado = 1;
                    ctx.replyWithHTML("Imagen recibida correctamente en el servidor. Te queda enviar <b>" + numero + "</b> cosa/s más.");

                    console.log("BODY RESULT");
                    console.log(body.result);

                    fotoIncidencia = nombreFinalFichero;
                    guardarIncidencias(ctx);

                    // Si queremos enviar una foto de internet...
                    // ctx.replyWithPhoto("https://kjhdishf.com/fichero.jpg");
                }); // Fin de descargar fichero.
            }); // Fin del request
        });// Fin del bot.on photo

        bot.on("location", (ctx) => {
            contador += 2;
            numero = 4 - contador;

            latitudIncidencia = ctx.message.location.latitude.toString();
            longitudIncidencia = ctx.message.location.longitude.toString();

            ctx.replyWithHTML("Localización/Ubicación recibida. Texto recibido. Te queda enviar <b>" + numero + "</b> cosa/s más.");
            estado = 1;
            guardarIncidencias(ctx);
        });

        function guardarIncidencias(ctx) {
            console.log("Guardar incidencias: ");
            console.log(textoIncidencia + " - " + fotoIncidencia + " - " + longitudIncidencia + " - " + latitudIncidencia);
            if ((textoIncidencia != null && textoIncidencia != 0) && (fotoIncidencia != null && fotoIncidencia != 0) && longitudIncidencia != null && latitudIncidencia != null) {
                ctx.replyWithHTML("Guardando la incidencia...");
                let incidenciaAAñadir = {
                    texto_inc: textoIncidencia,
                    foto: fotoIncidencia,
                    longitud: longitudIncidencia,
                    latitud: latitudIncidencia
                }; // fin 

                // Ahora tengo que añadir esta incidencia al usuario en MongoDB
                // Meter en el array de incidencias con un push y despues hacer el .save

                Usuario.find({ telegram_id: idUsuario }, function (err, res) {
                    console.log("Usuario.find");
                    if (err) {
                        console.log("Error 'err'");
                        ctx.replyWithHTML("ERROR! Ha habido un error guardando la incidencia.");
                    } else if (!res) {
                        console.log("Error '!res'");
                        ctx.replyWithHTML("ERROR! Ha habido un error guardando la incidencia.");
                    } else {
                        console.log("No hay error, estás de suerte");

                        /*
                        console.log("RESULTADO: ");
                        console.log(res[0]);
                        */
                        console.log("Latitud: ");
                        console.log(typeof incidenciaAAñadir.latitud);

                        res[0].incidencias.push(incidenciaAAñadir);

                        res[0].save((error) => {
                            console.log("ERROR: ");
                            if (error != null)
                                console.log(error);
                            else
                                console.log("No hay error");

                            if (error) {
                                ctx.replyWithHTML("Error guardando la incidencia!");
                            } else {
                                ctx.replyWithHTML("Incidencia guardada correctamente");

                                // API submission: /api/records/1.0/search/?dataset=espana-municipios&facet=municipio&geofilter.distance=42.30611%2C+-6.772738 
                                // Aquí hay que hacer la petición a la API, para avisar a los agentes

                                var urlAEnviar = "https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&facet=municipio&geofilter.distance=" + incidenciaAAñadir.latitud + "%2C+" + incidenciaAAñadir.longitud;
                                request("https://public.opendatasoft.com/api/records/1.0/search/?dataset=espana-municipios&facet=municipio&geofilter.distance=" + incidenciaAAñadir.latitud + "%2C+" + incidenciaAAñadir.longitud, function (err, requestRES, body) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        /*
                                        console.log("RESPUESTA DEL REQUEST A " + urlAEnviar);
                                        console.log(JSON.parse(body));
                                        */
                                        console.log(incidenciaAAñadir);
                                        console.log(JSON.parse(body));

                                        var cuerpo = JSON.parse(body);
                                        if (typeof cuerpo.records[0] !== "undefined") {
                                            var municipio = cuerpo.records[0].fields.municipio;
                                            // console.log("Municipio: ");
                                            // console.log(municipio);

                                            Ayuntamiento.find({ nombre: municipio }, function (err, res) {
                                                if (typeof res[0] !== "undefined") {
                                                    var correoAyuntamiento = res[0].email;

                                                    // Una vez se tiene el municipio, notificar al ayuntamiento correspondiente
                                                    var transporter = nodemailer.createTransport({
                                                        service: 'gmail',
                                                        auth: {
                                                            user: 'a19andresaa@iessanclemente.net',
                                                            pass: 'Aloalvand19999'
                                                        }
                                                    });

                                                    var mailOptions = {
                                                        from: 'a19andresaa@iessanclemente.net',
                                                        to: correoAyuntamiento,
                                                        subject: 'Una incidencia ha sido subida dentro o cerca del territorio municipal',
                                                        text: "Una nueva incidencia que empieza por: " + incidenciaAAñadir.texto_inc.substring(0, 20) + "... ha aparecido en las inmediaciones, tus agentes han sido alertados."
                                                    };

                                                    transporter.sendMail(mailOptions, function (error, info) {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            console.log('Email sent: ' + info.response);
                                                        }
                                                    });

                                                    var agentesAyuntamiento = res[0].agentes;
                                                    for (var z = 0; z < agentesAyuntamiento.length; z++) {
                                                        bot.telegram.sendMessage(agentesAyuntamiento[z], "Una nueva incidencia que empieza por: " + incidenciaAAñadir.texto_inc.substring(0, 20) + "... ha aparecido en las inmediaciones de tu rango de acción, agente.");
                                                    }
                                                } else {
                                                    console.log("Ayuntamiento no encontrado!");
                                                }
                                            });


                                        } else {
                                            console.log("Records[0] no encontrado!");
                                        }
                                    }
                                });

                                ctx.replyWithHTML("Agentes del municipio avisados");
                            }
                        });



                        // Usuario.save({"telegram_id" : idUsuario}, {$push: {"incidencias" : incidenciaAAñadir}});

                    }
                });
                contador = 0;
                estado = 0;
                textoIncidencia = null;
                fotoIncidencia = null;
                longitudIncidencia = null;
                latitudIncidencia = null;
                console.log("Incidencia GUARDADA.");
            }
        }
    });

    bot.command("finalizarincidencias", (ctx) => {
        ctx.replyWithHTML("La incidencia se ha cancelado.");
        contador = 0;
        estado = 0;
        textoIncidencia = null;
        fotoIncidencia = null;
        longitudIncidencia = null;
        latitudIncidencia = null;
    }); // Fin del fin de inicidencias

    bot.command("registraragente", (ctx) => {
        let contadorAgente = 0;
        let codigoINE = "";
        idUsuario = ctx.message.from.id;

        ctx.replyWithHTML("Por favor envíe un código INE de ayuntamiento.");

        bot.on("text", (ctx) => {
            if (contadorAgente == 0) {
                ctx.replyWithHTML("Comprobando INE...");
                codigoINE = ctx.message.text;

                Ayuntamiento.find({ codigoINE: ctx.message.text }, function (err, res) {
                    if (res[0] != null) {
                        if (!(res[0].agentes.includes(idUsuario))) {
                            ctx.replyWithHTML("INE correcto, introduzca el codigo de registro correspondiente al ayuntamiento de " + res[0].nombre);
                            contadorAgente++;
                        } else {
                            ctx.replyWithHTML("Ya estás registrado como agente para el ayuntamiento de " + res[0].nombre);
                        }

                    } else {
                        ctx.replyWithHTML("El Codigo INE introducido no se encuentra en nuestra base de datos.");
                    }
                });

            } else {
                ctx.replyWithHTML("Comprobado codigo de registro");
                Ayuntamiento.find({ codigoINE: codigoINE }, function (err, res) {
                    var codigoRegistroAgentes = res[0].codigoRegistroAgentes;

                    if (ctx.message.text == codigoRegistroAgentes) {
                        // Todo validado, paso libre agente!
                        // ctx.replyWithHTML("Código de registro correcto.");
                        res[0].agentes.push(idUsuario);

                        res[0].save((error) => {
                            console.log("CONSOLA DE ERRORES: ");
                            if (error != null)
                                console.log(error);
                            else
                                console.log("No hay error");

                            if (error) {
                                ctx.replyWithHTML("Error registrando al agente!");
                            } else {
                                contadorAgente = 0;
                                ctx.replyWithHTML("Todo correcto. Bienvenido, agente.");
                            }
                        });
                    } else {
                        ctx.replyWithHTML("El código de registro introducido es incorrecto.");
                        contadorAgente = 0;
                    }

                });
            }
        });
    }); // Fin del registro de agentes 
}


// FOTOS
var descargarFichero = function (url, nombreFichero, callback) {
    request.head(url, function (err, res, body) {
        // console.log(`content-type:`, res.headers['content-type']);
        // console.log(`content-length:`, res.headers['content-length']);
        request(url).pipe(fs.createWriteStream(nombreFichero)).on('close', callback);
    });
}
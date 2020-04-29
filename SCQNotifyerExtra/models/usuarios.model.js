// Cargamos el módulo de MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definimos el schema para una colección llamada Incidencia
let incidenciaSchema = new Schema({
    fecha: {type: Date, required: true, default: Date.now},
    foto: {type: String, required: true, max: 120},
    latitud: {type: String, required: true, max: 20},
    longitud: {type: String, required: true, max: 20},
    texto_inc: {type: String, required: true, max: 255},
    resuelta: {type: Boolean, required: false, default: '0'},
    texto_res: {type: String, required: false, max: 255, default: ""}
});

// Definimos el schema para una colección llamada Usuario
let usuarioSchema = new Schema({
    nombre: {type: String, required: true, max: 50},
    apellidos: {type: String, required: false, max: 100},
    username: {type: String, required: false, max: 50},
    telegram_id: {type: String, required: true, max: 50},
    email: {type: String, required: false, max: 100, default: ''},
    solucionador: {type: Boolean, required: true, default: '0'},
    notificaciones: {type: Boolean, required: true, default: '1'},
    incidencias: [incidenciaSchema]
});

let agenteSchema = new Schema({
    telegram_id: {type: String, required: true, max: 50}
});

// Comprobar los maxs
let ayuntamientoSchema = new Schema({
    nombre: {type: String, required: true, max: 50},
    email: {type: String, required: true, max: 100, default: ''},
    municipio: {type: String, required: true, max: 150},
    codigoINE: {type: String, required: true, max: 5},
    codigoRegistroAgentes: {type: String, required: true, max: 20},
    agentes: []
});

// Exportamos el modelo
module.exports = {Usuario : mongoose.model('Usuario', usuarioSchema), Incidencia : mongoose.model("Incidencia", incidenciaSchema), Ayuntamiento : mongoose.model("Ayuntamiento", ayuntamientoSchema)};
// web.routes.js
// Módulos necesarios
const express = require('express');
const router = express.Router();
const web_controller = require('../controllers/web.controller');

// Definición de rutas públicas:

router.get('/pruebas',web_controller.web_pruebas);
router.get('/',web_controller.web_raiz);

// 1. Venir a routes y crear la nueva ruta así: 
// 2. Ir a controller y crear el controlador en la zona de FUNCIONES
router.get("/login", web_controller.web_login);
router.post("/login", web_controller.web_loginxPOST);
router.get("/info", web_controller.web_info);
// router.get("/loginx", web_controller.web_loginx);
router.get("/desconectar", web_controller.web_desconectar);
router.get("/incidencias", web_controller.web_incidencias);
router.get("/mapa", web_controller.web_mapa);
router.get("/meteo", web_controller.web_meteo);
router.get("/misincidencias", web_controller.web_misincidencias);
router.get("/perfil", web_controller.web_perfil);
router.get("/infotelegram", web_controller.web_infotelegram);

// Creados por mí
router.post("/perfil", web_controller.web_edicion);
router.post("/meteo", web_controller.web_infoMeteo);
router.post("/guardarIncidencias", web_controller.web_guardarIncidencias);

router.get("/resolverIncidencias", web_controller.web_resolverIncidencias);
router.get("/formularioResolucion", web_controller.web_formularioResolucion);
router.post("/formularioResolucion", web_controller.web_formularioResolucionPOST);

router.get("/editarIncidencias", web_controller.web_editarIncidencias);
router.post("/editarIncidencias", web_controller.web_editarIncidenciasPOST);

router.get("/borrarIncidencias", web_controller.web_borrarIncidencias);
router.get("/cancelarCuenta", web_controller.web_cancelarCuenta );

router.get("/altaAyuntamientos", web_controller.web_altaAyuntamientos);
router.post("/altaAyuntamientos", web_controller.web_altaAyuntamientosPOST);

router.get("/resolverIncAgente", web_controller.web_resolverIncAgente);

// Definición de rutas privadas. Las pasaremos por el middleware de autorización:
module.exports = router

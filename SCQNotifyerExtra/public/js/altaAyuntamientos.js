// ALTAAYUNTAMIENTOS.JS ----
$(document).ready(() => {
    $(document.body).on("submit", "#formularioAltasAyun", function (event) {
        event.preventDefault();
        // Hacer un post a la misma url que la usada para entrar en altaAyuntamientos.ejs
        var nombreAyuntamiento = $("#nombreAyuntamiento").val();
        var emailAyuntamiento  = $("#emailAyuntamiento").val();
        var nombreMunicipio = $("#nombreMunicipio").val();
        var codigoRegistroAgentes = $("#codigoRegistroAgentes").val();
        var codigoINE = $("#codigoINE").val();

        if ((codigoINE == null) || (codigoINE == "")) {
            codigoINE = nombreMunicipio;
        }
        console.log("ANTES DEL POST DEL ALTA DE AYUNTAMIENTOS");
        $.post("/altaAyuntamientos", { nombre: nombreAyuntamiento, email: emailAyuntamiento, municipio: nombreMunicipio, codigoRegistroAgentes: codigoRegistroAgentes, codigoINE: codigoINE }, function (res) {
            console.log("FIN DEL POST DEL ALTA DE AYUNTAMIENTOS.");
            console.log(res);

            window.location.href = "http://a19andresaa2.mywire.org/info";
        });
    });
});
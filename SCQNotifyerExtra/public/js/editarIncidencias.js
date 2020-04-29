// EDITARINCIDENCIAS.EJS
$(document).ready(() => {
    $(document.body).on("submit", "#formularioEdicion", function (event) {
        event.preventDefault();
        var textoIncidencia = $("#textoIncidencia").val();
        if (textoIncidencia != "") {
            var url = window.location.href;
            var id_incidencia = url.split("?id=")[1].split("&texto_inc")[0];

            console.log("ID_INCIDENCIA");
            console.log(id_incidencia);

            // Subimos a mongoDB el texto_res
            $.post("/editarIncidencias", { id: id_incidencia, texto_inc: textoIncidencia }, function (res) {
                console.log("Finalizado");
                window.location.href = "http://a19andresaa2.mywire.org/misIncidencias";
            });
        } else {
            alert("Por favor, introduce algún texto de resolución.");
        }
    });
});
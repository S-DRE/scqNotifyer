// FORMULARIORESOLUCION.JS
$(document).ready(() => {

    $(document.body).on("submit", "#formularioResolucion", function (event) {
        event.preventDefault();
        // Una vez enviado el texto, subirlo a la BD de mongoDB, cambiar la variable resuelta a true
        // Después, preparar el envío del email y del texto por Telegram.

        var textoResolucion = $("#textoResolucion").val();
        if (textoResolucion != "") {
            var url = window.location.href
            var id_incidencia = url.split("?id=")[1];

            // Subimos a mongoDB el texto_res
            $.post("/formularioResolucion", { id: id_incidencia, texto_res: textoResolucion }, function (res) {

                /*
                console.log(res);
                var link = "mailto:"+res.emailUsuario
                    + "?cc=a19andresaa@mywire.org"
                    + "&subject=" + escape("Tu incidencia ha sido resuelta")
                    + "&body=" + "Tu resolución, que empieza con: " + res.texto_incIncidencia.substring(0, 20) + "... Ha sido resuelta, puedes acceder a la resolución en nuestra web."
                    ;

                window.location.href = link;
                */

                console.log(res);

                window.location.href = "http://a19andresaa2.mywire.org/incidencias";
            });
        } else {
            alert("Por favor, introduce algún texto de resolución.");
        }
    });
});
// PERFIL.JS
$(document).ready(() => {
    $("#btNegro2").hide();
    $("#btRojo2").hide();
    $(document.body).on("click", "#btNegro", function() {
        // DECLARACIÓN DE VARIABLES: 
        let username = $("#usernameLabel");
        let nombre = $("#nombreLabel");
        let apellidos = $("#apellidosLabel");
        let email = $("#emailLabel");
        let idTelegram = $("#idTelegramLabel");
        let valorNotificar = $("#notificacionesLabel");

        let botonEditar = $("#btNegro");
        let botonConfirmar = $("#btNegro2");
        let botonCancelar1 = $("#btRojo");
        let botonCancelar2 = $("#btRojo2");

        $(this).hide();
        botonCancelar1.hide();
        
        botonConfirmar.show();
        botonCancelar2.show();
        

        console.log("CLICK BOTON EDITAR");

        // MODIFICACIÓN DE CAMPOS: 

        // let valorNotificar = $("input[name='radioNotificaciones']:checked").val();

        // De momento, no se puede modificar el usuario.
        // username.html("<input id = 'usernameInput' placeholder = 'Introduzca aquí su nuevo nombre de usuario'>");

        nombre.parent().html("<input id = 'nombreInput' placeholder = 'Introduzca aquí su nombre'>");

        apellidos.parent().html("<input id = 'apellidosInput' placeholder = 'Introduzca aquí sus apellidos'>");

        email.parent().html("<input id = 'emailInput' type = 'email' placeholder = 'Introduzca aquí su email'>");

        idTelegram.parent().text("El ID de Telegram no se puede modificar, ¿Qué tramas, moreno?");

        valorNotificar.text("Configuración de las notificaciones. Activadas?");

        valorNotificar.parent().html("<div class='radio'>Sí: <input type='radio' id='notifSi' name='radioNotificaciones' checked>" +
            " - No: <input type='radio' id='notifNo' name='radioNotificaciones' checked></div>");

        // botonConfirmar.html("<a class='btn btn-dark' id='btNegro' role='button' style = 'color: white;'>Confirmar</a>");
    }); // Fin del click
    $(document.body).on("click", "#btNegro2", function() {
        console.log("CLICK BOTON CONFIRMAR");
        // DECLARACIÓN DE VARIABLES: 
        let nombreInput = $("#nombreInput").val();
        let apellidosInput = $("#apellidosInput").val();
        let emailInput = $("#emailInput").val();
        let idTelegramInput = $("#idTelegramInput").val();
        let valorNotificarBool = false; 

        // HAY QUE AÑADIR LOS RADIO BUTTONS

        if ($("#notifSi").prop("checked")) {
            valorNotificarBool = true;
        } else if ($("#notifNo").prop("checked")) {
            valorNotificarBool = false;
        }

        console.log("ANTES DEL POST - NOMBRE INPUT");
        alert("Nombre: " + nombreInput + " Apellidos: " + apellidosInput + " email: " + emailInput + " notificar: " + valorNotificarBool);
        
        // Envío al routes
        $.post("/perfil", {nombre: nombreInput, apellidos: apellidosInput, email: emailInput, notificar: valorNotificarBool}, function(data) {

            window.location = "/perfil";
        }); // Fin del post
    }); // Fin del click 2

    $(document.body).on("click", "#btRojo2", function() {
        window.location = "/perfil";
    });
}); // Fin del document ready
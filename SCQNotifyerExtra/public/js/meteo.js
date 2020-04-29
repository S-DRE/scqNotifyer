// METEO.JS ----
$(document).ready(() => {
    $(document.body).on("click", "#ciudadButton", function() {

        let ciudadInputVal = $("#ciudadInput").val();
        console.log("METEO.JS ----")
        $.post("/meteo", {ciudad: ciudadInputVal}, function(res) {
            // window.location = "/meteo";
            
            console.log("RESULTADO");
            console.log(res);


            $("#infoLabel").html(res.info);
        });
    });
});
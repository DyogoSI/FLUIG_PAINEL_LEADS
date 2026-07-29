window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Navegacao = (function () {
    "use strict";

    function inicializar() {
        $(".lead-sidebar-menu").on("click", "a", function (evento) {
            evento.preventDefault();

            var alvo = $(this).attr("href");

            if (!alvo || !$(alvo).length) {
                return;
            }

            $(".lead-sidebar-menu a").removeClass("active");
            $(this).addClass("active");

            $("html, body").animate(
                { scrollTop: $(alvo).offset().top - 100 },
                450
            );
        });
    }

    return {
        inicializar: inicializar
    };
}());

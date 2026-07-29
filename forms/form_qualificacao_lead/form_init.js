window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Init = (function () {
    "use strict";

    function inicializarModulo(nomeModulo, nomeMetodo) {
        var modulo = IRHOLeads[nomeModulo];

        if (!modulo || typeof modulo[nomeMetodo] !== "function") {
            console.error(
                "[IRHO-LEADS] Módulo não carregado: "
                + nomeModulo
                + "."
                + nomeMetodo
            );

            return;
        }

        modulo[nomeMetodo]();
    }

    function inicializar() {
        inicializarModulo("Navegacao", "inicializar");
        inicializarModulo("Tentativas", "inicializar");
        inicializarModulo("Visibilidade", "aplicar");
        inicializarModulo("Bloqueios", "aplicar");
        inicializarModulo("Classificacao", "inicializar");
        inicializarModulo("Salvamento", "inicializar");
    }

    return {
        inicializar: inicializar
    };
}());

$(document).ready(function () {
    IRHOLeads.Init.inicializar();
});
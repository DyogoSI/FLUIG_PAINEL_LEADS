window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Nutricao = (function () {
    "use strict";

    function podeNutrir() {
        return !IRHOLeads.Contexto.somenteLeitura()
            && IRHOLeads.Contexto.ehAtividadeComercial();
    }

    function confirmar() {
        if (!podeNutrir()) {
            return;
        }

        if (!window.confirm(
            "Encaminhar este lead para Nutrição?"
        )) {
            return;
        }

        IRHOLeads.Salvamento.movimentarNutricao();
    }

    function inicializar() {
        $("#btnNutricao")
            .off("click.irhoNutricao")
            .on("click.irhoNutricao", confirmar);
    }

    return {
        inicializar: inicializar
    };
}());

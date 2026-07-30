window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Bloqueios = (function () {
    "use strict";

    function aplicar() {
        var somenteLeitura =
            IRHOLeads.Contexto.somenteLeitura();

        var historico =
            !IRHOLeads.Contexto.ehEtapaInicial()
            && !IRHOLeads.Contexto
                .ehTentativaContato();

        bloquearHistoricoPerdas();

        if (somenteLeitura) {
            $("form")
                .addClass("lead-readonly");

            bloquearTentativas();
            bloquearFunil();
            bloquearRecuperacao();
            return;
        }

        if (!IRHOLeads.Contexto.ehEtapaInicial()) {
            bloquearFunil();
        }

        if (!IRHOLeads.Contexto.ehLeadPerdido()) {
            bloquearRecuperacao();
        }

        if (historico) {
            $("form")
                .addClass("lead-history-mode");

            bloquearTentativas();
        }
    }

    function bloquearFunil() {
        $('input[name="funil_destino"]')
            .prop("disabled", true)
            .attr("tabindex", "-1");
    }

    function bloquearTentativas() {
        /*
         * Inputs e textareas podem ficar readonly.
         * O select precisa ser desabilitado.
         */
        $("#tbTentativasContato")
            .find("input:not([type='hidden']), textarea")
            .prop("readonly", true)
            .attr("tabindex", "-1");

        $("#tbTentativasContato")
            .find("select")
            .prop("disabled", true)
            .attr("tabindex", "-1");

        $("#btnAdicionarTentativa, .lead-btn-remove")
            .addClass("lead-hidden")
            .prop("disabled", true);
    }

    function bloquearHistoricoPerdas() {
        $("#tbHistoricoPerdas")
            .find("input:not([type='hidden']), textarea")
            .prop("readonly", true)
            .attr("tabindex", "-1");
    }

    function bloquearRecuperacao() {
        $('input[name="atividade_recuperacao"]')
            .prop("disabled", true)
            .attr("tabindex", "-1");
    }

    return {
        aplicar: aplicar
    };
}());

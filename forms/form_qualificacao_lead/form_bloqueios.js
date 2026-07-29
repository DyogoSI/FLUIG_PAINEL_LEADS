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

        if (somenteLeitura) {
            $("form")
                .addClass("lead-readonly");

            bloquearTentativas();
            return;
        }

        if (historico) {
            $("form")
                .addClass("lead-history-mode");

            bloquearTentativas();
        }
    }

    function ehEtapaInicial(atividadeAtual) {
        return atividade === 0 || atividade === 6;
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

    return {
        aplicar: aplicar
    };
}());
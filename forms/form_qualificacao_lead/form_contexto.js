window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Contexto = (function () {
    "use strict";

    var ATIVIDADE_TENTATIVA_CONTATO = 4;

    function valorCampo(nomeCampo) {
        var campo = document.querySelector(
            '[name="' + nomeCampo + '"]'
        );

        return campo
            ? String(campo.value || "")
            : "";
    }

    function numeroInteiro(valor) {
        var numero = parseInt(valor, 10);

        return isNaN(numero)
            ? null
            : numero;
    }

    function atividadeAtual() {
        var atividade;

        /*
         * Prioridade 1:
         * contexto enviado diretamente pelo displayFields.
         */
        if (
            window.IRHO_FORM_CONTEXT
            && window.IRHO_FORM_CONTEXT
                .atividadeAtual !== undefined
        ) {
            atividade = numeroInteiro(
                window.IRHO_FORM_CONTEXT
                    .atividadeAtual
            );

            if (atividade !== null) {
                return atividade;
            }
        }

        /*
         * Prioridade 2:
         * campo oculto persistido no formulário.
         */
        atividade = numeroInteiro(
            valorCampo("atividade_atual")
        );

        if (atividade !== null) {
            return atividade;
        }

        /*
         * Fallback seguro.
         */
        return 0;
    }

    function modoFormulario() {
        if (
            window.IRHO_FORM_CONTEXT
            && window.IRHO_FORM_CONTEXT
                .modoFormulario
        ) {
            return String(
                window.IRHO_FORM_CONTEXT
                    .modoFormulario
            ).toUpperCase();
        }

        return valorCampo(
            "modo_formulario"
        ).toUpperCase();
    }

    function somenteLeitura() {
        return modoFormulario() === "VIEW";
    }

    function ehEtapaInicial() {
        var atividade = atividadeAtual();

        return atividade === 0 || atividade === 6;
    }

    function ehTentativaContato() {
        return atividadeAtual()
            === ATIVIDADE_TENTATIVA_CONTATO;
    }

    return {
        ATIVIDADE_TENTATIVA_CONTATO:
            ATIVIDADE_TENTATIVA_CONTATO,

        atividadeAtual:
            atividadeAtual,

        modoFormulario:
            modoFormulario,

        somenteLeitura:
            somenteLeitura,

        ehEtapaInicial:
            ehEtapaInicial,

        ehTentativaContato:
            ehTentativaContato
    };
}());
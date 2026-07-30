window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Funil = (function () {
    "use strict";

    function obterSelecionado() {
        return $('input[name="funil_destino"]:checked').val() || "";
    }

    function validar() {
        var erros = [];

        if (obterSelecionado() === "") {
            erros.push("Selecione o funil de destino antes de avançar.");
        }

        return erros;
    }

    function inicializar() {
        if (
            IRHOLeads.Contexto.ehEtapaInicial()
            && !IRHOLeads.Contexto.somenteLeitura()
        ) {
            $('input[name="funil_destino"]')
                .prop("disabled", false)
                .removeAttr("tabindex");
        }

        $('input[name="funil_destino"]')
            .off("change.irhoFunil")
            .on("change.irhoFunil", function () {
                $("#mensagemDefinicaoFunil")
                    .removeClass("is-visible is-error")
                    .html("");
            });
    }

    return {
        inicializar: inicializar,
        obterSelecionado: obterSelecionado,
        validar: validar
    };
}());

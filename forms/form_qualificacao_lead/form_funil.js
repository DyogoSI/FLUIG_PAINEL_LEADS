window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Funil = (function () {
    "use strict";

    function obterSelecionado() {
        return $('input[name="funil_destino"]:checked').val() || "";
    }

    function validar() {
        var erros = [];
        var selecionado = obterSelecionado();

        if (selecionado === "") {
            erros.push("Selecione o funil de destino antes de avançar.");
        } else if (
            selecionado !== "CLIENTE"
            && selecionado !== "PARCEIRO"
        ) {
            erros.push("O funil de destino selecionado é inválido.");
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
                $("#funil_origem_fluxo").val(obterSelecionado());

                $("#mensagemDefinicaoFunil")
                    .removeClass("is-visible is-error")
                    .html("");
            });

        if (
            IRHOLeads.Contexto.ehEtapaInicial()
            && obterSelecionado() !== ""
        ) {
            $("#funil_origem_fluxo").val(obterSelecionado());
        }
    }

    return {
        inicializar: inicializar,
        obterSelecionado: obterSelecionado,
        validar: validar
    };
}());

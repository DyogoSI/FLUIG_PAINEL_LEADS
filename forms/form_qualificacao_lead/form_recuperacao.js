window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Recuperacao = (function () {
    "use strict";

    function obterSelecionada() {
        return $('input[name="atividade_recuperacao"]:checked').val() || "";
    }

    function validar() {
        var erros = [];

        if (obterSelecionada() === "") {
            erros.push(
                "Selecione a atividade para a qual o lead deve retornar."
            );
        }

        return erros;
    }

    function inicializar() {
        $('input[name="atividade_recuperacao"]')
            .off("change.irhoRecuperacao")
            .on("change.irhoRecuperacao", function () {
                $("#mensagemRecuperacao")
                    .removeClass("is-visible is-error")
                    .html("");
            });
    }

    return {
        inicializar: inicializar,
        obterSelecionada: obterSelecionada,
        validar: validar
    };
}());

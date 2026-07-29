window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Classificacao = (function () {
    "use strict";

    function abrir() {
        var painel = $("#painelClassificacao");

        if (!IRHOLeads.Contexto.ehTentativaContato()) {
            return;
        }

        painel
            .removeClass(
                "lead-hidden lead-classification-history"
            )
            .stop(true, true)
            .hide()
            .slideDown(250);

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .removeClass("lead-hidden");

        $("#mensagemClassificacao")
            .removeClass(
                "is-visible is-error is-success"
            )
            .html("");

        setTimeout(function () {
            $("html, body").animate(
                {
                    scrollTop: painel.offset().top - 90
                },
                400
            );

            focarPrimeiroCampoVazio();
        }, 100);
    }

    function movimentar() {
        var errosTentativas = IRHOLeads.Obrigatoriedade
            .validarTentativas(true);

        var errosClassificacao = IRHOLeads.Obrigatoriedade
            .validarClassificacao();

        var erros = errosTentativas.concat(
            errosClassificacao
        );

        if (erros.length > 0) {
            mostrarFeedback(
                erros.join("<br>"),
                "error"
            );

            focarPrimeiroCampoVazio();
            return;
        }

        mostrarFeedback(
            "Classificação validada. Abrindo a movimentação da atividade...",
            "success"
        );

        IRHOLeads.Salvamento.movimentarAtividade();
    }

    function focarPrimeiroCampoVazio() {
        var primeiroCampo = $("#painelClassificacao")
            .find("textarea")
            .filter(function () {
                return $.trim($(this).val() || "") === "";
            })
            .first();

        if (primeiroCampo.length) {
            primeiroCampo.trigger("focus");
        }
    }

    function mostrarFeedback(mensagem, tipo) {
        $("#mensagemClassificacao")
            .removeClass("is-error is-success")
            .addClass("is-visible")
            .addClass(
                tipo === "error"
                    ? "is-error"
                    : "is-success"
            )
            .html(mensagem);
    }

    function inicializar() {
        $("#btnMovimentarClassificacao")
            .off("click.irhoClassificacao")
            .on(
                "click.irhoClassificacao",
                movimentar
            );
    }

    return {
        inicializar: inicializar,
        abrir: abrir,
        movimentar: movimentar
    };
}());
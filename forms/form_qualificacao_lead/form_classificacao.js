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

        if (
            !primeiroCampo.length
            && obterPotencial() === ""
        ) {
            primeiroCampo = $("#painelClassificacao")
                .find("[data-potential-value]")
                .first();
        }

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

    function atualizarVisualPotencial() {
        var potencial = obterPotencial();

        $("[data-potential-value]").each(function () {
            var selecionado = $(this).attr("data-potential-value") === potencial;

            $(this)
                .toggleClass("is-selected", selecionado)
                .attr("aria-pressed", selecionado ? "true" : "false");
        });
    }

    function obterPotencial() {
        return $.trim($("#class_potencial").val() || "");
    }

    function selecionarPotencial() {
        if (
            IRHOLeads.Contexto.somenteLeitura()
            || !IRHOLeads.Contexto.ehTentativaContato()
        ) {
            return;
        }

        $("#class_potencial").val(
            $(this).attr("data-potential-value") || ""
        );
        atualizarVisualPotencial();
    }

    function inicializar() {
        $("#btnMovimentarClassificacao")
            .off("click.irhoClassificacao")
            .on(
                "click.irhoClassificacao",
                movimentar
            );

        $(".lead-potential-options")
            .off("click.irhoClassificacao", "[data-potential-value]")
            .on(
                "click.irhoClassificacao",
                "[data-potential-value]",
                selecionarPotencial
            );

        atualizarVisualPotencial();
    }

    return {
        inicializar: inicializar,
        abrir: abrir,
        movimentar: movimentar
    };
}());

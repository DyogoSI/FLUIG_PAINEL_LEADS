window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Recuperacao = (function () {
    "use strict";

    function obterSelecionada() {
        return $('input[name="atividade_recuperacao"]:checked').val() || "";
    }

    function obterFunil() {
        return IRHOLeads.Contexto.funilDestino();
    }

    function valoresPermitidos() {
        var funil = obterFunil();

        if (funil === "PARCEIRO") {
            return ["72"];
        }

        if (funil === "CLIENTE") {
            return ["4", "19", "21"];
        }

        return ["4", "19", "21", "72"];
    }

    function validar() {
        var erros = [];

        if (obterSelecionada() === "") {
            erros.push(
                "Selecione a atividade para a qual o lead deve retornar."
            );
            return erros;
        }

        if (valoresPermitidos().indexOf(obterSelecionada()) === -1) {
            erros.push(
                "A atividade de retorno selecionada não pertence ao funil original."
            );
        }

        return erros;
    }

    function inicializar() {
        filtrarOpcoes();

        $('input[name="atividade_recuperacao"]')
            .off("change.irhoRecuperacao")
            .on("change.irhoRecuperacao", function () {
                $("#mensagemRecuperacao")
                    .removeClass("is-visible is-error")
                    .html("");
            });
    }

    function filtrarOpcoes() {
        var funil = obterFunil();
        var selecionada = obterSelecionada();

        $("[data-funil-recuperacao]").each(function () {
            var compativel = funil === ""
                || $(this).attr("data-funil-recuperacao") === funil;

            $(this).toggleClass("lead-hidden", !compativel);
        });

        if (
            selecionada !== ""
            && valoresPermitidos().indexOf(selecionada) === -1
        ) {
            $('input[name="atividade_recuperacao"]:checked').prop(
                "checked",
                false
            );
        }
    }

    function garantirFunilParaRetorno() {
        var funil = obterFunil();
        var atividade = obterSelecionada();

        if (funil !== "CLIENTE" && funil !== "PARCEIRO") {
            funil = atividade === "72" ? "PARCEIRO" : "CLIENTE";
        }

        $("#funil_origem_fluxo").val(funil);
        return funil;
    }

    return {
        inicializar: inicializar,
        obterSelecionada: obterSelecionada,
        validar: validar,
        filtrarOpcoes: filtrarOpcoes,
        garantirFunilParaRetorno: garantirFunilParaRetorno
    };
}());

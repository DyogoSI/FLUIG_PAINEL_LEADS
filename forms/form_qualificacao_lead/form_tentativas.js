window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Tentativas = (function () {
    "use strict";

    function doisDigitos(valor) {
        return valor < 10 ? "0" + valor : String(valor);
    }

    function dataAtualBR() {
        var agora = new Date();

        return doisDigitos(agora.getDate())
            + "/"
            + doisDigitos(agora.getMonth() + 1)
            + "/"
            + agora.getFullYear();
    }

    function horaAtual() {
        var agora = new Date();

        return doisDigitos(agora.getHours())
            + ":"
            + doisDigitos(agora.getMinutes());
    }

    function adicionar() {
        if (!podeEditarTentativas()) {
            exibirErro(
                "As tentativas estão disponíveis apenas para consulta nesta etapa."
            );

            return;
        }

        if (typeof wdkAddChild !== "function") {
            exibirErro(
                "A tabela pai x filho só pode ser adicionada dentro do formulário do Fluig."
            );
            return;
        }

        var indice = wdkAddChild("tbTentativasContato");

        IRHOLeads.Dados.campoFilho("tent_id", indice)
            .val(gerarIdTemporario());

        IRHOLeads.Dados.campoFilho("tent_data", indice)
            .val(dataAtualBR());

        IRHOLeads.Dados.campoFilho("tent_hora", indice)
            .val(horaAtual());

        renumerar();
        atualizarEstadoVazio();
        focarNovaTentativa(indice);
    }

    function remover(botao) {
        if (!podeEditarTentativas()) {
            exibirErro(
                "Não é permitido excluir tentativas nesta etapa."
            );

            return;
        }

        if (typeof fnWdkRemoveChild !== "function") {
            exibirErro(
                "Não foi possível localizar a função nativa de remoção do Fluig."
            );
            return;
        }

        fnWdkRemoveChild(botao);
        renumerar();
        atualizarEstadoVazio();
    }

    function renumerar() {
        var indices = IRHOLeads.Dados.indicesTentativas();

        indices.forEach(function (indice, posicao) {
            var numero = posicao + 1;

            IRHOLeads.Dados.campoFilho("tent_ordem", indice)
                .val(numero);

            IRHOLeads.Dados.campoFilho("tent_numero", indice)
                .val(numero + "ª");
        });
    }

    function atualizarEstadoVazio() {
        var possuiTentativas =
            IRHOLeads.Dados.indicesTentativas().length > 0;

        $("#tentativasEstadoVazio")
            .toggleClass("lead-hidden", possuiTentativas);
    }

    function focarNovaTentativa(indice) {
        setTimeout(function () {
            IRHOLeads.Dados.campoFilho("tent_meio", indice)
                .trigger("focus");
        }, 50);
    }

    function mascararData(valor) {
        var numeros = String(valor || "").replace(/\D/g, "").substring(0, 8);

        if (numeros.length > 4) {
            return numeros.substring(0, 2)
                + "/"
                + numeros.substring(2, 4)
                + "/"
                + numeros.substring(4);
        }

        if (numeros.length > 2) {
            return numeros.substring(0, 2)
                + "/"
                + numeros.substring(2);
        }

        return numeros;
    }

    function mascararHora(valor) {
        var numeros = String(valor || "").replace(/\D/g, "").substring(0, 4);

        if (numeros.length > 2) {
            return numeros.substring(0, 2)
                + ":"
                + numeros.substring(2);
        }

        return numeros;
    }

    function podeEditarTentativas() {
        return !IRHOLeads.Contexto.somenteLeitura()
            && IRHOLeads.Contexto.atividadeAtual()
            === IRHOLeads.Contexto
                .ATIVIDADE_TENTATIVA_CONTATO;
    }

    function gerarIdTemporario() {
        return "TENT-"
            + new Date().getTime()
            + "-"
            + Math.floor(Math.random() * 100000);
    }

    function exibirErro(mensagem) {
        if (window.FLUIGC && FLUIGC.toast) {
            FLUIGC.toast({
                title: "Tentativas de contato",
                message: mensagem,
                type: "danger"
            });
            return;
        }

        window.alert(mensagem);
    }

    function inicializar() {
        $("#btnAdicionarTentativa").on("click", adicionar);

        $("#tbTentativasContato").on(
            "click",
            '[data-action="remover-tentativa"]',
            function () {
                remover(this);
            }
        );

        $("#tbTentativasContato").on(
            "input",
            '[name^="tent_data___"]',
            function () {
                this.value = mascararData(this.value);
            }
        );

        $("#tbTentativasContato").on(
            "input",
            '[name^="tent_hora___"]',
            function () {
                this.value = mascararHora(this.value);
            }
        );

        renumerar();
        atualizarEstadoVazio();
    }

    return {
        inicializar: inicializar,
        adicionar: adicionar,
        remover: remover,
        renumerar: renumerar,
        atualizarEstadoVazio: atualizarEstadoVazio
    };
}());

window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Visibilidade = (function () {
    "use strict";

    function aplicar() {
        var atividadeAtual = IRHOLeads.Contexto.atividadeAtual();

        console.log("[IRHO-LEADS] Aplicando visibilidade.", {
            atividadeAtual: atividadeAtual,
            atividadeTentativa: IRHOLeads.Contexto.ATIVIDADE_TENTATIVA_CONTATO,
            modoFormulario: IRHOLeads.Contexto.modoFormulario()
        });

        restaurarEstadoPadrao();

        if (IRHOLeads.Contexto.ehEtapaInicial()) {
            aplicarEtapaInicial();
        } else if (IRHOLeads.Contexto.ehTentativaContato()) {
            aplicarTentativaContato();
        } else {
            aplicarHistorico();

            if (IRHOLeads.Contexto.ehLeadPerdido()) {
                aplicarLeadPerdido();
            } else if (IRHOLeads.Contexto.ehAtividadeComercial()) {
                aplicarAcoesComerciaisHistorico();
            }
        }

        aplicarHistoricoPerdas();

        if (IRHOLeads.Contexto.somenteLeitura()) {
            aplicarSomenteLeitura();
        }
    }

    function restaurarEstadoPadrao() {
        $("form").removeClass(
            "lead-history-mode lead-readonly lead-lost-mode"
        );

        $("#painelAcoes").removeClass("lead-hidden");
        $("#painelTentativas").removeClass("lead-hidden");
        $("#painelDefinicaoFunil").addClass("lead-hidden");
        $("#painelHistoricoPerdas").addClass("lead-hidden");
        $("#painelRecuperacao").addClass("lead-hidden");

        $("#painelClassificacao")
            .addClass("lead-hidden")
            .removeClass("lead-classification-history");

        $("#btnAdicionarTentativa").removeClass("lead-hidden");
        $("#btnSalvarContinuar").removeClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");
        $("#btnMovimentarClassificacao").removeClass("lead-hidden");
        $("#btnLeadPerdido").addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelDefinicaoFunil']")
            .addClass("lead-hidden");
        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelAcoes']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelHistoricoPerdas']")
            .addClass("lead-hidden");

        $(".lead-action-grid")
            .removeClass("lead-action-grid-single");

        $("#btnConcluirAtividade .lead-action-content strong").text(
            "Concluir e avançar"
        );

        $("#btnConcluirAtividade .lead-action-content span").text(
            "Valida os registros e abre a movimentação para encerrar o fluxo."
        );

        $(".lead-panel-subtitle").text(
            "Registre cada abordagem realizada sem substituir as tentativas anteriores."
        );
    }

    function aplicarEtapaInicial() {
        $("#painelDefinicaoFunil").removeClass("lead-hidden");
        $("#painelTentativas").addClass("lead-hidden");
        $("#painelClassificacao").addClass("lead-hidden");
        $("#painelHistoricoPerdas").addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelDefinicaoFunil']")
            .removeClass("lead-hidden");
        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .addClass("lead-hidden");

        $("#btnSalvarContinuar").addClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");
        $("#btnLeadPerdido").addClass("lead-hidden");

        $(".lead-action-grid")
            .addClass("lead-action-grid-single");

        $(".lead-actions-intro").text(
            "Avance a solicitação para iniciar o acompanhamento do lead."
        );

        $("#btnConcluirAtividade .lead-action-content strong").text(
            "Enviar e avançar"
        );

        $("#btnConcluirAtividade .lead-action-content span").text(
            "Movimenta a solicitação para a atividade 4 – Tentativa de contato."
        );

        ajustarMenuAtivo();
    }

    function aplicarTentativaContato() {
        $("#painelTentativas").removeClass("lead-hidden");
        $("#painelClassificacao").addClass("lead-hidden");

        $("#btnAdicionarTentativa").removeClass("lead-hidden");
        $("#btnSalvarContinuar").removeClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");
        $("#btnMovimentarClassificacao").removeClass("lead-hidden");
        $("#btnLeadPerdido").removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .addClass("lead-hidden");

        $(".lead-actions-intro").text(
            "Salve para continuar depois ou classifique o lead para avançar."
        );

        $("#btnConcluirAtividade .lead-action-content strong").text(
            "Classificar e avançar"
        );

        $("#btnConcluirAtividade .lead-action-content span").text(
            "Valida as tentativas e abre a classificação obrigatória do lead."
        );
    }

    function aplicarHistorico() {
        $("form").addClass("lead-history-mode");

        $("#painelTentativas").removeClass("lead-hidden");

        $("#painelClassificacao")
            .removeClass("lead-hidden")
            .addClass("lead-classification-history");

        $("#btnAdicionarTentativa").addClass("lead-hidden");
        $("#btnMovimentarClassificacao").addClass("lead-hidden");
        $("#btnLeadPerdido").toggleClass(
            "lead-hidden",
            !IRHOLeads.Contexto.ehAtividadeComercial()
        );

        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .removeClass("lead-hidden");

        $(".lead-panel-subtitle").text(
            "Histórico das tentativas de contato registradas anteriormente."
        );

    }

    function aplicarLeadPerdido() {
        $("form").addClass("lead-lost-mode");

        $("#painelClassificacao")
            .addClass("lead-hidden")
            .removeClass("lead-classification-history");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .addClass("lead-hidden");

        $("#painelAcoes").removeClass("lead-hidden");
        $("#painelRecuperacao").removeClass("lead-hidden");
        $("#btnSalvarContinuar").addClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");
        $("#btnMovimentarClassificacao").addClass("lead-hidden");
        $("#btnLeadPerdido").addClass("lead-hidden");

        $(".lead-action-grid")
            .addClass("lead-action-grid-single");

        $(".lead-actions-intro").text(
            "Escolha a atividade comercial na qual o lead será recuperado."
        );

        $("#btnConcluirAtividade .lead-action-content strong").text(
            "Recuperar Lead"
        );

        $("#btnConcluirAtividade .lead-action-content span").text(
            "Movimenta a solicitação para a atividade selecionada no Funil Cliente."
        );
    }

    function aplicarAcoesComerciaisHistorico() {
        $("#painelAcoes").removeClass("lead-hidden");
        $("#btnSalvarContinuar").removeClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");
        $("#btnLeadPerdido").removeClass("lead-hidden");

        $(".lead-actions-intro").text(
            "Salve para continuar depois, movimente o lead ou registre a perda."
        );

        $("#btnConcluirAtividade .lead-action-content strong").text(
            "Movimentar atividade"
        );

        $("#btnConcluirAtividade .lead-action-content span").text(
            "Avança a solicitação para a próxima etapa do fluxo comercial."
        );
    }

    function aplicarHistoricoPerdas() {
        var mostrar = IRHOLeads.Contexto.ehLeadPerdido()
            || (
                IRHOLeads.Contexto.somenteLeitura()
                && IRHOLeads.Perdas.possuiHistorico()
            );

        $("#painelHistoricoPerdas")
            .toggleClass("lead-hidden", !mostrar);

        $(".lead-sidebar-menu a[href='#painelHistoricoPerdas']")
            .toggleClass("lead-hidden", !mostrar);

        IRHOLeads.Perdas.atualizarHistorico();
    }

    function aplicarSomenteLeitura() {
        $("form").addClass("lead-readonly");

        $("#painelAcoes").addClass("lead-hidden");
        $("#btnAdicionarTentativa").addClass("lead-hidden");
        $("#btnSalvarContinuar").addClass("lead-hidden");
        $("#btnConcluirAtividade").addClass("lead-hidden");
        $("#btnMovimentarClassificacao").addClass("lead-hidden");
        $("#btnLeadPerdido").addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelAcoes']")
            .addClass("lead-hidden");

        ajustarMenuAtivo();
    }

    function ajustarMenuAtivo() {
        var itemAtivo = $(".lead-sidebar-menu a.active");

        if (itemAtivo.length && itemAtivo.hasClass("lead-hidden")) {
            $(".lead-sidebar-menu a").removeClass("active");

            $(".lead-sidebar-menu a[href='#painelEmpresaContato']")
                .addClass("active");
        }
    }

    return {
        aplicar: aplicar
    };
}());

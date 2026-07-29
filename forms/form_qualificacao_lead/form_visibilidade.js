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
            return;
        }

        if (IRHOLeads.Contexto.ehTentativaContato()) {
            aplicarTentativaContato();
            return;
        }

        aplicarHistorico();
    }

    function restaurarEstadoPadrao() {
        $("form").removeClass(
            "lead-history-mode lead-readonly"
        );

        $("#painelAcoes").removeClass("lead-hidden");
        $("#painelTentativas").removeClass("lead-hidden");

        $("#painelClassificacao")
            .addClass("lead-hidden")
            .removeClass("lead-classification-history");

        $("#btnAdicionarTentativa").removeClass("lead-hidden");
        $("#btnSalvarContinuar").removeClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");
        $("#btnMovimentarClassificacao").removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelAcoes']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .addClass("lead-hidden");

        $(".lead-action-grid")
            .removeClass("lead-action-grid-single");

        $(".lead-panel-subtitle").text(
            "Registre cada abordagem realizada sem substituir as tentativas anteriores."
        );
    }

    function aplicarEtapaInicial() {
        $("#painelTentativas").addClass("lead-hidden");
        $("#painelClassificacao").addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .addClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .addClass("lead-hidden");

        $("#btnSalvarContinuar").addClass("lead-hidden");
        $("#btnConcluirAtividade").removeClass("lead-hidden");

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

        $(".lead-sidebar-menu a[href='#painelTentativas']")
            .removeClass("lead-hidden");

        $(".lead-sidebar-menu a[href='#painelClassificacao']")
            .removeClass("lead-hidden");

        $(".lead-panel-subtitle").text(
            "Histórico das tentativas de contato registradas anteriormente."
        );
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
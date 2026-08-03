window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Salvamento = (function () {
    "use strict";

    var SELETORES = {
        salvar: [
            "li[data-save]",
            '[data-action="save"]',
            '[data-action="save-task"]',
            '[data-action="saveTask"]',
            "#btnSave",
            "#saveTask",
            "#workflowSave",
            'button[title="Salvar"]',
            'a[title="Salvar"]'
        ],
        enviar: [
            '[data-action="send"]',
            '[data-action="send-task"]',
            '[data-action="sendTask"]',
            '#btnSend',
            '#sendTask',
            '#workflowSend',
            'button[title="Enviar"]',
            'a[title="Enviar"]'
        ]
    };

    var TEXTOS = {
        salvar: [
            "salvar",
            "salvar solicitação",
            "salvar solicitacao",
            "salvar tarefa"
        ],
        enviar: [
            "enviar",
            "movimentar",
            "enviar solicitação",
            "enviar solicitacao"
        ]
    };

    var destinoEspecialEmTransito = false;

    function salvarEContinuar() {
        var erros = [];

        if (!IRHOLeads.Contexto.ehAtividadeParceiro()) {
            erros = IRHOLeads.Obrigatoriedade.validarTentativas(false);
        }

        if (erros.length) {
            $("#acao_atividade").val("");
            mostrarFeedback(erros.join("<br>"), "error");
            return;
        }

        $("#acao_fluxo_comercial").val("");
        $("#acao_atividade").val("SALVAR");

        acionarSalvarNativo();
    }

    function concluirAtividade() {
        var atividadeAtual = IRHOLeads.Contexto.atividadeAtual();

        if (IRHOLeads.Contexto.ehEtapaInicial()) {
            var errosFunil = IRHOLeads.Funil.validar();

            if (errosFunil.length > 0) {
                $("#acao_atividade").val("");
                $("#acao_fluxo_comercial").val("");

                $("#mensagemDefinicaoFunil")
                    .removeClass("is-success")
                    .addClass("is-visible is-error")
                    .html(errosFunil.join("<br>"));

                mostrarFeedback(errosFunil.join("<br>"), "error");
                return;
            }

            movimentarAtividade();
            return;
        }

        if (IRHOLeads.Contexto.ehRedirecionamento()) {
            var errosRecuperacao = IRHOLeads.Recuperacao.validar();

            if (errosRecuperacao.length > 0) {
                $("#mensagemRecuperacao")
                    .addClass("is-visible is-error")
                    .html(errosRecuperacao.join("<br>"));

                mostrarFeedback(
                    errosRecuperacao.join("<br>"),
                    "error"
                );
                return;
            }

            movimentarAtividade();
            return;
        }

        if (
            atividadeAtual
            === IRHOLeads.Contexto.ATIVIDADE_TENTATIVA_CONTATO
        ) {
            var erros = IRHOLeads.Obrigatoriedade
                .validarTentativas(true);

            erros = erros.concat(
                IRHOLeads.Obrigatoriedade.validarClassificacao()
            );

            if (erros.length > 0) {
                $("#acao_atividade").val("");

                mostrarFeedback(
                    erros.join("<br>"),
                    "error"
                );

                return;
            }
            movimentarAtividade();
            return;
        }

        movimentarAtividade();
    }

    function movimentarComDestino(destinoFluxo) {
        destinoEspecialEmTransito = destinoFluxo !== "AVANCAR";
        $("#acao_fluxo_comercial").val(destinoFluxo);
        $("#acao_atividade").val("MOVIMENTAR");
        acionarAcaoNativa("enviar");

        setTimeout(function () {
            destinoEspecialEmTransito = false;
        }, 0);
    }

    function movimentarAtividade() {
        movimentarComDestino("AVANCAR");
    }

    function movimentarLeadPerdido() {
        var erros = IRHOLeads.Obrigatoriedade.validarPerda();

        if (
            IRHOLeads.Contexto.ehTentativaContato()
        ) {
            erros = erros.concat(
                IRHOLeads.Obrigatoriedade.validarTentativas(false)
            );
        }

        if (erros.length > 0) {
            mostrarFeedback(erros.join("<br>"), "error");
            return;
        }

        movimentarComDestino("LEAD_PERDIDO");
    }

    function movimentarNutricao() {
        if (!IRHOLeads.Contexto.ehAtividadeComercial()) {
            return;
        }

        movimentarComDestino("NUTRICAO");
    }

    function acionarSalvarNativo() {
        if (!prepararCamposParaEnvio()) {
            $("#acao_atividade").val("");
            return;
        }
        definirProcessando(true);

        console.log(
            "[IRHO-LEADS] Iniciando busca pela opção nativa de salvamento."
        );

        /*
         * Primeiro verifica se o menu já está aberto e se a opção
         * Somente salvar está realmente visível.
         */
        var salvarVisivel = localizarSalvarVisivel();

        if (salvarVisivel) {
            console.log(
                "[IRHO-LEADS] Opção Somente salvar já está visível.",
                salvarVisivel
            );

            executarCliqueNativo(salvarVisivel);
            finalizarProcessamentoSalvar();

            return;
        }

        /*
         * Se a opção estiver escondida, abre o menu do botão Enviar.
         */
        var menuAberto = abrirMenuSalvar();

        if (!menuAberto) {
            falhaSalvarNativo(
                "Não foi possível localizar o menu do botão Enviar."
            );

            return;
        }

        console.log(
            "[IRHO-LEADS] Menu do botão Enviar acionado. Aguardando a opção Somente salvar."
        );

        /*
         * Aguarda o Fluig renderizar ou exibir o menu.
         */
        setTimeout(function () {
            var opcaoSalvar = localizarSalvarVisivel();

            if (!opcaoSalvar) {
                falhaSalvarNativo(
                    "O menu foi aberto, mas a opção Somente salvar não ficou visível."
                );

                return;
            }

            console.log(
                "[IRHO-LEADS] Opção Somente salvar localizada.",
                opcaoSalvar
            );

            executarCliqueNativo(opcaoSalvar);
            finalizarProcessamentoSalvar();
        }, 500);
    }

    function acionarAcaoNativa(tipo) {
        var elemento;

        if (!prepararCamposParaEnvio()) {
            $("#acao_atividade").val("");
            $("#acao_fluxo_comercial").val("");
            destinoEspecialEmTransito = false;
            return;
        }
        definirProcessando(true);

        elemento = localizarAcao(tipo);

        if (elemento) {
            mostrarFeedback(
                tipo === "salvar"
                    ? "Salvando a solicitação sem movimentar a atividade..."
                    : "Abrindo a movimentação da atividade...",
                "success"
            );

            dispararClique(elemento);

            setTimeout(function () {
                definirProcessando(false);
            }, 1500);

            return;
        }

        if (tipo === "salvar" && abrirMenuDeAcoes()) {
            setTimeout(function () {
                var acaoSalvar = localizarAcao("salvar");

                if (acaoSalvar) {
                    dispararClique(acaoSalvar);
                    definirProcessando(false);
                    return;
                }

                falhaAcaoNativa(tipo);
            }, 200);

            return;
        }

        falhaAcaoNativa(tipo);
    }

    function prepararCamposParaEnvio() {
        var ativo = document.activeElement;
        var errosEmpresaContato = [];

        if (ativo && typeof ativo.blur === "function") {
            ativo.blur();
        }

        if (
            IRHOLeads.Contexto.ehTentativaContato()
            && IRHOLeads.EmpresaContato
            && typeof IRHOLeads.EmpresaContato.prepararParaSalvar === "function"
        ) {
            errosEmpresaContato = IRHOLeads.EmpresaContato.prepararParaSalvar() || [];
            if (errosEmpresaContato.length > 0) {
                mostrarFeedback(errosEmpresaContato.join("<br>"), "error");
                definirProcessando(false);
                return false;
            }
        }

        $("form").find("input, select, textarea").trigger("change");
        IRHOLeads.Tentativas.renumerar();

        if (
            IRHOLeads.Contexto.ehRedirecionamento()
            && $("#acao_atividade").val() === "MOVIMENTAR"
        ) {
            IRHOLeads.Recuperacao.garantirFunilParaRetorno();
        }

        if (
            IRHOLeads.EmpresaContato
            && typeof IRHOLeads.EmpresaContato.inicializar === "function"
        ) {
            IRHOLeads.EmpresaContato.inicializar();
        }

        return true;
    }

    function localizarAcao(tipo) {
        var documentos = obterDocumentosHospedeiros();
        var seletores = SELETORES[tipo] || [];
        var textos = TEXTOS[tipo] || [];

        var i;
        var j;
        var elemento;

        if (tipo === "salvar") {
            for (i = 0; i < documentos.length; i++) {
                elemento = documentos[i].querySelector(
                    "li[data-save]"
                );

                if (elemento) {
                    return elemento;
                }
            }
        }

        for (i = 0; i < documentos.length; i++) {
            for (j = 0; j < seletores.length; j++) {
                elemento = documentos[i].querySelector(seletores[j]);

                if (elemento && !elementoDesabilitado(elemento)) {
                    return elemento;
                }
            }
        }

        for (i = 0; i < documentos.length; i++) {
            elemento = localizarPorTexto(documentos[i], textos, true);

            if (elemento) {
                return elemento;
            }
        }

        for (i = 0; i < documentos.length; i++) {
            elemento = localizarPorTexto(documentos[i], textos, false);

            if (elemento) {
                return elemento;
            }
        }

        return null;
    }

    function localizarPorTexto(documento, textos, somenteVisiveis) {
        var elementos = documento.querySelectorAll(
            "button, a, [role='button']"
        );
        var i;
        var textoElemento;

        for (i = 0; i < elementos.length; i++) {
            if (elementoDesabilitado(elementos[i])) {
                continue;
            }

            if (somenteVisiveis && !elementoVisivel(elementos[i])) {
                continue;
            }

            textoElemento = normalizarTexto(
                elementos[i].textContent
                || elementos[i].innerText
                || elementos[i].getAttribute("title")
                || elementos[i].getAttribute("aria-label")
                || ""
            );

            if (textos.indexOf(textoElemento) >= 0) {
                return elementos[i];
            }
        }

        return null;
    }

    function abrirMenuSalvar() {
        var documentos = obterDocumentosHospedeiros();

        var seletoresMenu = [
            "[data-toggle='dropdown']",
            ".dropdown-toggle",
            "[aria-haspopup='true']"
        ];

        for (var i = 0; i < documentos.length; i++) {
            var documentoAtual = documentos[i];

            for (var j = 0; j < seletoresMenu.length; j++) {
                var elementos = documentoAtual.querySelectorAll(
                    seletoresMenu[j]
                );

                for (var k = 0; k < elementos.length; k++) {
                    var elemento = elementos[k];

                    if (!elementoRealmenteVisivel(elemento)) {
                        continue;
                    }

                    var texto = normalizarTexto(
                        elemento.innerText
                        || elemento.textContent
                        || elemento.getAttribute("title")
                        || elemento.getAttribute("aria-label")
                        || ""
                    );

                    /*
                     * Busca o menu relacionado ao botão Enviar.
                     */
                    if (
                        texto.indexOf("enviar") >= 0
                        || elemento.closest("[data-send]")
                        || elemento.parentNode.querySelector(
                            "[data-send]"
                        )
                    ) {
                        console.log(
                            "[IRHO-LEADS] Controle do menu Enviar localizado.",
                            elemento
                        );

                        executarCliqueNativo(elemento);

                        return true;
                    }
                }
            }
        }

        /*
         * Segunda tentativa: localiza um botão visível com o texto Enviar
         * e procura o controle dropdown no mesmo container.
         */
        for (var d = 0; d < documentos.length; d++) {
            var botoes = documentos[d].querySelectorAll(
                "button, a, [role='button']"
            );

            for (var b = 0; b < botoes.length; b++) {
                var botao = botoes[b];

                if (!elementoRealmenteVisivel(botao)) {
                    continue;
                }

                var textoBotao = normalizarTexto(
                    botao.innerText
                    || botao.textContent
                    || botao.getAttribute("title")
                    || botao.getAttribute("aria-label")
                    || ""
                );

                if (textoBotao.indexOf("enviar") < 0) {
                    continue;
                }

                var container = botao.parentNode;

                if (!container) {
                    continue;
                }

                var toggle = container.querySelector(
                    "[data-toggle='dropdown'], "
                    + ".dropdown-toggle, "
                    + "[aria-haspopup='true']"
                );

                if (toggle) {
                    console.log(
                        "[IRHO-LEADS] Toggle associado ao botão Enviar localizado.",
                        toggle
                    );

                    executarCliqueNativo(toggle);

                    return true;
                }
            }
        }

        return false;
    }

    function executarCliqueNativo(elemento) {
        if (!elemento) {
            return;
        }

        var documento = elemento.ownerDocument;
        var janela = documento.defaultView || window;

        /*
         * Primeiro tenta utilizar o jQuery do próprio documento
         * onde o componente do Fluig foi criado.
         */
        try {
            if (
                janela.jQuery
                && typeof janela.jQuery === "function"
            ) {
                janela.jQuery(elemento).trigger("click");

                return;
            }
        } catch (eJquery) {
            console.warn(
                "[IRHO-LEADS] Falha ao acionar com jQuery.",
                eJquery
            );
        }

        /*
         * Fallback com sequência completa de eventos do mouse.
         */
        var eventos = [
            "mousedown",
            "mouseup",
            "click"
        ];

        for (var i = 0; i < eventos.length; i++) {
            var evento = documento.createEvent(
                "MouseEvents"
            );

            evento.initMouseEvent(
                eventos[i],
                true,
                true,
                janela,
                1,
                0,
                0,
                0,
                0,
                false,
                false,
                false,
                false,
                0,
                null
            );

            elemento.dispatchEvent(evento);
        }
    }

    function finalizarProcessamentoSalvar() {
        mostrarFeedback(
            "Solicitação enviada para salvamento sem movimentar a atividade.",
            "success"
        );

        setTimeout(function () {
            definirProcessando(false);
        }, 1500);
    }

    function falhaSalvarNativo(detalhe) {
        console.error(
            "[IRHO-LEADS] Falha no salvamento nativo: "
            + detalhe
        );

        definirProcessando(false);

        mostrarFeedback(
            detalhe
            + " Abra o menu do botão Enviar e utilize a opção Somente salvar.",
            "error"
        );
    }

    function obterDocumentosHospedeiros() {
        var documentos = [];

        function adicionarDocumento(documento) {
            if (!documento) {
                return;
            }

            if (documentos.indexOf(documento) === -1) {
                documentos.push(documento);
            }
        }

        /*
         * Inclui o próprio documento do formulário.
         */
        adicionarDocumento(document);

        try {
            if (
                window.parent
                && window.parent.document
            ) {
                adicionarDocumento(
                    window.parent.document
                );
            }
        } catch (eParent) {
            console.warn(
                "[IRHO-LEADS] Não foi possível acessar o documento pai.",
                eParent
            );
        }

        try {
            if (
                window.top
                && window.top.document
            ) {
                adicionarDocumento(
                    window.top.document
                );
            }
        } catch (eTop) {
            console.warn(
                "[IRHO-LEADS] Não foi possível acessar o documento principal.",
                eTop
            );
        }

        return documentos;
    }

    function localizarSalvarVisivel() {
        var documentos = obterDocumentosHospedeiros();

        for (var i = 0; i < documentos.length; i++) {
            var opcoes = documentos[i].querySelectorAll(
                "li[data-save]"
            );

            for (var j = 0; j < opcoes.length; j++) {
                if (elementoRealmenteVisivel(opcoes[j])) {
                    return opcoes[j];
                }
            }
        }

        return null;
    }

    function elementoRealmenteVisivel(elemento) {
        if (!elemento) {
            return false;
        }

        var documento = elemento.ownerDocument;
        var janela = documento.defaultView || window;
        var estilo = janela.getComputedStyle(elemento);

        if (
            estilo.display === "none"
            || estilo.visibility === "hidden"
            || estilo.opacity === "0"
        ) {
            return false;
        }

        var retangulo = elemento.getBoundingClientRect();

        return retangulo.width > 0
            && retangulo.height > 0;
    }

    function dispararClique(elemento) {
        if (typeof elemento.click === "function") {
            elemento.click();
            return;
        }

        var evento = elemento.ownerDocument.createEvent("MouseEvents");
        evento.initMouseEvent(
            "click",
            true,
            true,
            elemento.ownerDocument.defaultView,
            1,
            0,
            0,
            0,
            0,
            false,
            false,
            false,
            false,
            0,
            null
        );
        elemento.dispatchEvent(evento);
    }

    function elementoDesabilitado(elemento) {
        return Boolean(
            elemento.disabled
            || elemento.getAttribute("aria-disabled") === "true"
            || elemento.classList.contains("disabled")
        );
    }

    function elementoVisivel(elemento) {
        return Boolean(
            elemento.offsetWidth
            || elemento.offsetHeight
            || elemento.getClientRects().length
        );
    }

    function normalizarTexto(valor) {
        var texto = String(valor || "").toLowerCase();

        if (typeof texto.normalize === "function") {
            texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        return texto.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    }

    function falhaAcaoNativa(tipo) {
        definirProcessando(false);

        mostrarFeedback(
            tipo === "salvar"
                ? "Não foi possível localizar automaticamente a ação Salvar do Fluig. Use Salvar no menu ao lado do botão Enviar e informe o seletor da sua versão para ajustarmos a ponte."
                : "Não foi possível localizar automaticamente o botão Enviar do Fluig. Use o botão Enviar da barra superior e informe o seletor da sua versão para ajustarmos a ponte.",
            "error"
        );
    }

    function definirProcessando(processando) {
        $(
            "#btnSalvarContinuar, "
            + "#btnConcluirAtividade, "
            + "#btnMovimentarClassificacao, "
            + "#btnLeadPerdido, "
            + "#btnNutricao"
        )
            .prop("disabled", processando)
            .attr(
                "aria-busy",
                processando ? "true" : "false"
            );
    }

    function mostrarFeedback(mensagem, tipo) {
        var elemento = $("#mensagemAcaoAtividade");

        elemento
            .removeClass("is-error is-success")
            .addClass("is-visible")
            .addClass(tipo === "error" ? "is-error" : "is-success")
            .html(mensagem);
    }

    function inicializar() {
        $("#btnSalvarContinuar")
            .off("click.irhoSalvamento")
            .on(
                "click.irhoSalvamento",
                salvarEContinuar
            );

        $("#btnConcluirAtividade")
            .off("click.irhoSalvamento")
            .on(
                "click.irhoSalvamento",
                concluirAtividade
            );

        vincularEnviarNativo();
    }

    function vincularEnviarNativo() {
        var documentos = obterDocumentosHospedeiros();

        for (var i = 0; i < documentos.length; i++) {
            $(documentos[i])
                .off("click.irhoEnviarNativo", SELETORES.enviar.join(", "))
                .on(
                    "click.irhoEnviarNativo",
                    SELETORES.enviar.join(", "),
                    function () {
                        if (
                            destinoEspecialEmTransito
                            || !IRHOLeads.Contexto.ehAtividadeComercial()
                        ) {
                            return;
                        }

                        $("#acao_atividade").val("MOVIMENTAR");
                        $("#acao_fluxo_comercial").val("AVANCAR");
                    }
                );
        }
    }

    return {
        inicializar:
            inicializar,

        salvarEContinuar:
            salvarEContinuar,

        concluirAtividade:
            concluirAtividade,

        movimentarAtividade:
            movimentarAtividade,

        movimentarLeadPerdido:
            movimentarLeadPerdido,

        movimentarNutricao:
            movimentarNutricao
    };
}());

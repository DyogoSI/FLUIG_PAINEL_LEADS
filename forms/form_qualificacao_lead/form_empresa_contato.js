window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.EmpresaContato = (function () {
    "use strict";

    var INTERVALO_CARROSSEL_MS = 6000;
    var indiceAtual = 0;
    var usuarioInteragiu = false;
    var temporizadorCarrossel = null;
    var pausadoPorPonteiro = false;
    var inicializado = false;

    function obterValorCampo(nomeCampo) {
        var campo = $("#" + nomeCampo);

        if (!campo.length) {
            return "";
        }

        return campo.val();
    }

    function valorLimpo(valor) {
        var texto;
        var textoNormalizado;

        if (valor == null) {
            return "";
        }

        texto = $.trim(String(valor));
        textoNormalizado = texto.toLowerCase();

        if (
            texto === ""
            || textoNormalizado === "undefined"
            || textoNormalizado === "null"
            || textoNormalizado === "nan"
            || texto === "[object Object]"
        ) {
            return "";
        }

        return texto;
    }

    function normalizarTexto(valor) {
        var texto = valorLimpo(valor);

        return texto === "" ? "Não informado" : texto;
    }

    function urlSegura(valor) {
        var url = valorLimpo(valor);

        if (url === "") {
            return "";
        }

        if (!/^https?:\/\//i.test(url)) {
            if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/.*)?$/i.test(url)) {
                return "";
            }

            url = "https://" + url;
        }

        return /^https?:\/\//i.test(url) ? url : "";
    }

    function emailSeguro(valor) {
        var email = valorLimpo(valor);

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
    }

    function telefoneSeguro(valor) {
        var telefone = valorLimpo(valor).replace(/[^0-9+]/g, "");

        return telefone.replace(/\D/g, "").length >= 8 ? telefone : "";
    }

    function renderizarValor(elemento, valor, tipoLink) {
        var destino = $(elemento);
        var texto = normalizarTexto(valor);
        var link = "";
        var ancora;

        destino.empty();

        if (texto === "Não informado") {
            destino.text(texto);
            return;
        }

        if (tipoLink === "url") {
            link = urlSegura(valor);
        } else if (tipoLink === "email") {
            link = emailSeguro(valor);
            link = link === "" ? "" : "mailto:" + link;
        } else if (tipoLink === "tel") {
            link = telefoneSeguro(valor);
            link = link === "" ? "" : "tel:" + link;
        }

        if (link === "") {
            destino.text(texto);
            return;
        }

        ancora = $("<a></a>").text(texto).attr("href", link);

        if (tipoLink === "url") {
            ancora.attr("target", "_blank").attr("rel", "noopener noreferrer");
        }

        destino.append(ancora);
    }

    function renderizarCampos() {
        $("#painelEmpresaContato [data-lead-field]").each(function () {
            renderizarValor(
                this,
                obterValorCampo($(this).attr("data-lead-field")),
                $(this).attr("data-link-type") || ""
            );
        });
    }

    function removerAcentos(valor) {
        var texto = String(valor || "");

        if (typeof texto.normalize === "function") {
            return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        return texto
            .replace(/á|à|ã|â|ä/gi, "a")
            .replace(/é|è|ê|ë/gi, "e")
            .replace(/í|ì|î|ï/gi, "i")
            .replace(/ó|ò|õ|ô|ö/gi, "o")
            .replace(/ú|ù|û|ü/gi, "u")
            .replace(/ç/gi, "c");
    }

    function classeScore(valor) {
        var texto = removerAcentos(valorLimpo(valor)).toLowerCase();

        if (texto.indexOf("alta") === 0) {
            return "is-high";
        }

        if (texto.indexOf("media") === 0) {
            return "is-medium";
        }

        if (texto.indexOf("baixa") === 0) {
            return "is-low";
        }

        return "is-unknown";
    }

    function formatarPercentual(valor) {
        var percentual = valorLimpo(valor);

        if (percentual === "") {
            return "Não informado";
        }

        return /%$/.test(percentual) ? percentual : percentual + "%";
    }

    function renderizarScore() {
        var percentual = obterValorCampo("score_percentual");
        var classificacao = obterValorCampo("score_classificacao");
        var destinoClassificacao = $("#painelEmpresaContato [data-score-classificacao]");

        $("#painelEmpresaContato [data-score-percentual]")
            .text(formatarPercentual(percentual));

        destinoClassificacao
            .removeClass("is-high is-medium is-low is-unknown")
            .addClass(classeScore(classificacao))
            .text(normalizarTexto(classificacao));
    }

    function normalizarResposta(valor) {
        var resposta = removerAcentos(valorLimpo(valor)).toUpperCase();

        if (
            resposta === "SIM"
            || resposta === "S"
            || resposta === "TRUE"
            || resposta === "1"
        ) {
            return {
                texto: "Sim",
                classe: "is-yes"
            };
        }

        if (
            resposta === "NAO"
            || resposta === "N"
            || resposta === "FALSE"
            || resposta === "0"
        ) {
            return {
                texto: "Não",
                classe: "is-no"
            };
        }

        return {
            texto: "Não informado",
            classe: "is-unknown"
        };
    }

    function renderizarQualificacao() {
        $("#painelEmpresaContato [data-qualificacao-field]").each(function () {
            var resposta = normalizarResposta(
                obterValorCampo($(this).attr("data-qualificacao-field"))
            );

            $(this)
                .removeClass("is-yes is-no is-unknown")
                .addClass(resposta.classe)
                .text(resposta.texto);
        });
    }

    function renderizarDadosAdicionais() {
        var campos = [
            "segmento",
            "cidade",
            "contato_telefone",
            "crm_origem"
        ];
        var possuiDados = false;

        for (var i = 0; i < campos.length; i++) {
            if (valorLimpo(obterValorCampo(campos[i])) !== "") {
                possuiDados = true;
                break;
            }
        }

        $("#painelEmpresaContato [data-additional-rows]")
            .toggleClass("lead-hidden", !possuiDados);

        $("#painelEmpresaContato [data-additional-empty]")
            .toggleClass("lead-hidden", possuiDados);
    }

    function obterIndicesContatosSecundarios() {
        var indices = [];

        $("#tbContatosSecundarios")
            .find("[name^='cont_sec_'][name*='___']")
            .each(function () {
                var partes = ($(this).attr("name") || "").split("___");

                if (partes.length === 2 && indices.indexOf(partes[1]) === -1) {
                    indices.push(partes[1]);
                }
            });

        return indices;
    }

    function obterValorFilho(nomeCampo, indice) {
        return $("[name='" + nomeCampo + "___" + indice + "']").val() || "";
    }

    function adicionarLinhaContato(container, rotulo, valor, tipoLink) {
        var linha = $("<div></div>").addClass("lead-data-row");
        var valorVisual = $("<span></span>").addClass("lead-data-value");

        linha.append($("<span></span>").addClass("lead-data-label").text(rotulo));
        renderizarValor(valorVisual, valor, tipoLink);
        linha.append(valorVisual);
        container.append(linha);
    }

    function renderizarContatosSecundarios() {
        var destino = $("#painelEmpresaContato [data-secondary-contacts]");
        var indices = obterIndicesContatosSecundarios();
        var contatosValidos = 0;

        destino.empty();

        for (var i = 0; i < indices.length; i++) {
            var indice = indices[i];
            var nome = obterValorFilho("cont_sec_nome", indice);
            var cargo = obterValorFilho("cont_sec_cargo", indice);
            var telefone = obterValorFilho("cont_sec_telefone", indice);
            var email = obterValorFilho("cont_sec_email", indice);
            var linkedin = obterValorFilho("cont_sec_linkedin", indice);
            var ordem = obterValorFilho("cont_sec_ordem", indice);

            if (
                valorLimpo(nome) === ""
                && valorLimpo(cargo) === ""
                && valorLimpo(telefone) === ""
                && valorLimpo(email) === ""
                && valorLimpo(linkedin) === ""
            ) {
                continue;
            }

            contatosValidos++;

            var card = $("<article></article>").addClass("lead-secondary-contact");
            var titulo = ordem === "" ? contatosValidos : ordem;

            card.append(
                $("<strong></strong>").text("Contato " + titulo)
            );
            adicionarLinhaContato(card, "Nome", nome, "");
            adicionarLinhaContato(card, "Cargo", cargo, "");
            adicionarLinhaContato(card, "Telefone", telefone, "tel");
            adicionarLinhaContato(card, "E-mail", email, "email");
            adicionarLinhaContato(card, "LinkedIn", linkedin, "url");
            destino.append(card);
        }

        if (contatosValidos === 0) {
            destino.append(
                $("<p></p>")
                    .addClass("lead-secondary-empty")
                    .text("Nenhum contato secundário informado.")
            );
        }
    }

    function slides() {
        return $("#painelEmpresaContato .lead-info-slide");
    }

    function quantidadeSlides() {
        return slides().length;
    }

    function exibirSlide(indice) {
        var listaSlides = slides();
        var total = listaSlides.length;
        var titulo;

        if (total === 0) {
            return;
        }

        indiceAtual = ((indice % total) + total) % total;

        listaSlides.each(function (posicao) {
            var ativo = posicao === indiceAtual;

            $(this)
                .toggleClass("is-active", ativo)
                .attr("aria-hidden", ativo ? "false" : "true");
        });

        $("#painelEmpresaContato .lead-info-indicator").each(function () {
            var ativo = parseInt($(this).attr("data-slide-index"), 10) === indiceAtual;

            $(this)
                .toggleClass("is-active", ativo)
                .attr("aria-selected", ativo ? "true" : "false")
                .attr("tabindex", ativo ? "0" : "-1");
        });

        titulo = $(listaSlides[indiceAtual]).attr("data-slide-title") || "Informações do lead";
        $("#painelEmpresaContato [data-carousel-title]").text(titulo);
        $("#painelEmpresaContato [data-carousel-position]")
            .text((indiceAtual + 1) + " de " + total);
    }

    function exibirProximoSlide() {
        exibirSlide(indiceAtual + 1);
    }

    function pararRotacaoAutomatica() {
        if (temporizadorCarrossel !== null) {
            clearInterval(temporizadorCarrossel);
            temporizadorCarrossel = null;
        }
    }

    function iniciarRotacaoAutomatica() {
        if (
            usuarioInteragiu
            || pausadoPorPonteiro
            || temporizadorCarrossel !== null
            || quantidadeSlides() <= 1
        ) {
            return;
        }

        temporizadorCarrossel = setInterval(function () {
            exibirProximoSlide();
        }, INTERVALO_CARROSSEL_MS);
    }

    function registrarInteracaoManual() {
        usuarioInteragiu = true;
        pararRotacaoAutomatica();
    }

    function inicializarNavegacao() {
        var carrossel = $("#painelEmpresaContato .lead-info-carousel");

        exibirSlide(0);

        $("#painelEmpresaContato")
            .off("click.irhoEmpresaContato", "#btnInfoAnterior")
            .on("click.irhoEmpresaContato", "#btnInfoAnterior", function (evento) {
                evento.preventDefault();
                evento.stopPropagation();
                registrarInteracaoManual();
                exibirSlide(indiceAtual - 1);
            })
            .off("click.irhoEmpresaContato", "#btnInfoProximo")
            .on("click.irhoEmpresaContato", "#btnInfoProximo", function (evento) {
                evento.preventDefault();
                evento.stopPropagation();
                registrarInteracaoManual();
                exibirProximoSlide();
            });

        $("#painelEmpresaContato")
            .off("click.irhoEmpresaContato", ".lead-info-indicator")
            .on("click.irhoEmpresaContato", ".lead-info-indicator", function (evento) {
                evento.preventDefault();
                evento.stopPropagation();
                registrarInteracaoManual();
                exibirSlide(parseInt($(this).attr("data-slide-index"), 10));
            })
            .off("keydown.irhoEmpresaContato", ".lead-info-indicator")
            .on("keydown.irhoEmpresaContato", ".lead-info-indicator", function (evento) {
                if (evento.which !== 13 && evento.which !== 32) {
                    return;
                }

                evento.preventDefault();
                registrarInteracaoManual();
                exibirSlide(parseInt($(this).attr("data-slide-index"), 10));
            });

        carrossel
            .off("mouseenter.irhoEmpresaContato mouseleave.irhoEmpresaContato")
            .on("mouseenter.irhoEmpresaContato", function () {
                pausadoPorPonteiro = true;
                pararRotacaoAutomatica();
            })
            .on("mouseleave.irhoEmpresaContato", function () {
                pausadoPorPonteiro = false;

                if (!usuarioInteragiu) {
                    iniciarRotacaoAutomatica();
                }
            });

        $(window)
            .off("pagehide.irhoEmpresaContato beforeunload.irhoEmpresaContato")
            .on("pagehide.irhoEmpresaContato beforeunload.irhoEmpresaContato", function () {
                pararRotacaoAutomatica();
            });

        iniciarRotacaoAutomatica();
    }

    function atualizarApresentacao() {
        renderizarCampos();
        renderizarScore();
        renderizarQualificacao();
        renderizarContatosSecundarios();
        renderizarDadosAdicionais();
    }

    function inicializarListenersCampos() {
        var campos = [
            "#lead_id",
            "#empresa_nome",
            "#empresa_cnpj",
            "#empresa_site",
            "#tipo_registro",
            "#contato_nome",
            "#contato_cargo",
            "#contato_telefone",
            "#contato_email",
            "#contato_linkedin",
            "#score_percentual",
            "#score_classificacao",
            "#qual_mais_50",
            "#qual_decisor",
            "#qual_filiais",
            "#qual_conhece_empresa",
            "#qual_diagnostico_rh",
            "#segmento",
            "#cidade",
            "#crm_origem"
        ].join(", ");

        $(campos)
            .off("change.irhoEmpresaContato input.irhoEmpresaContato")
            .on("change.irhoEmpresaContato input.irhoEmpresaContato", atualizarApresentacao);

        $("#tbContatosSecundarios")
            .off("change.irhoEmpresaContato input.irhoEmpresaContato")
            .on(
                "change.irhoEmpresaContato input.irhoEmpresaContato",
                "input",
                renderizarContatosSecundarios
            );
    }

    function inicializar() {
        atualizarApresentacao();
        inicializarListenersCampos();

        if (inicializado) {
            return;
        }

        inicializado = true;
        inicializarNavegacao();
    }

    return {
        inicializar: inicializar
    };
}());

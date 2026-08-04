window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.EmpresaContato = (function () {
    "use strict";

    var INTERVALO_CARROSSEL_MS = 6000;
    var indiceAtual = 0;
    var usuarioInteragiu = false;
    var temporizadorCarrossel = null;
    var pausadoPorPonteiro = false;
    var inicializado = false;
    var edicaoAberta = false;
    var contatosEdicao = [];
    var sequenciaTemporaria = 0;
    var indicesContatosRemovidos = {};

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
        var contatosContexto = obterContatosSecundariosContexto();

        $("#tbContatosSecundarios")
            .find("[name^='cont_sec_'][name*='___']")
            .each(function () {
                var partes = ($(this).attr("name") || "").split("___");

                if (
                    partes.length === 2
                    && !indicesContatosRemovidos[String(partes[1])]
                    && indices.indexOf(partes[1]) === -1
                ) {
                    indices.push(partes[1]);
                }
            });

        for (var i = 0; i < contatosContexto.length; i++) {
            var indiceContexto = String(contatosContexto[i].indice || "");

            if (
                indiceContexto !== ""
                && !indicesContatosRemovidos[indiceContexto]
                && indices.indexOf(indiceContexto) === -1
            ) {
                indices.push(indiceContexto);
            }
        }

        return indices;
    }

    function obterContatosSecundariosContexto() {
        if (
            window.IRHO_FORM_CONTEXT
            && $.isArray(window.IRHO_FORM_CONTEXT.contatosSecundarios)
        ) {
            return window.IRHO_FORM_CONTEXT.contatosSecundarios;
        }

        return [];
    }

    function contatoSecundarioContexto(indice) {
        var contatos = obterContatosSecundariosContexto();

        if (indicesContatosRemovidos[String(indice)]) {
            return null;
        }

        for (var i = 0; i < contatos.length; i++) {
            if (String(contatos[i].indice) === String(indice)) {
                return contatos[i];
            }
        }

        return null;
    }

    function obterValorFilho(nomeCampo, indice) {
        var valor = $("[name='" + nomeCampo + "___" + indice + "']").val() || "";
        var contato;
        var propriedade;

        if (valor !== "") {
            return valor;
        }

        contato = contatoSecundarioContexto(indice);
        propriedade = nomeCampo.replace("cont_sec_", "");

        return contato && contato[propriedade]
            ? contato[propriedade]
            : "";
    }

    function adicionarLinhaContato(container, rotulo, valor, tipoLink) {
        var linha = $("<div></div>").addClass("lead-data-row");
        var valorVisual = $("<span></span>").addClass("lead-data-value");

        linha.append($("<span></span>").addClass("lead-data-label").text(rotulo));
        renderizarValor(valorVisual, valor, tipoLink);
        linha.append(valorVisual);
        container.append(linha);
    }

    function podeTrocarContatoPrincipal() {
        return window.IRHOLeads
            && IRHOLeads.Contexto
            && !IRHOLeads.Contexto.somenteLeitura()
            && IRHOLeads.Contexto.ehTentativaContato();
    }

    function podeEditarEmpresaContato() {
        return podeTrocarContatoPrincipal();
    }

    function contatoSecundarioPorIndice(indice) {
        for (var i = 0; i < contatosEdicao.length; i++) {
            if (String(contatosEdicao[i].indice) === String(indice)) {
                return contatosEdicao[i];
            }
        }

        return null;
    }

    function lerContatosParaEdicao() {
        var contatos = [];
        var indices = obterIndicesContatosSecundarios();

        for (var i = 0; i < indices.length; i++) {
            contatos.push({
                indice: String(indices[i]),
                novo: false,
                removido: false,
                ordem: obterValorFilho("cont_sec_ordem", indices[i]),
                nome: obterValorFilho("cont_sec_nome", indices[i]),
                cargo: obterValorFilho("cont_sec_cargo", indices[i]),
                telefone: obterValorFilho("cont_sec_telefone", indices[i]),
                email: obterValorFilho("cont_sec_email", indices[i]),
                linkedin: obterValorFilho("cont_sec_linkedin", indices[i])
            });
        }

        return contatos;
    }

    function preencherEditorPrincipal() {
        var campos = [
            "empresa_nome", "empresa_cnpj", "empresa_site",
            "segmento", "cidade",
            "contato_nome", "contato_cargo", "contato_telefone",
            "contato_email", "contato_linkedin"
        ];

        for (var i = 0; i < campos.length; i++) {
            $("#edit_" + campos[i]).val(obterValorCampo(campos[i]));
        }
    }

    function valorEditorContato(chave, campo) {
        return valorLimpo(
            $("#editorContatosSecundarios")
                .find('[data-secondary-key="' + chave + '"]')
                .find('[data-secondary-field="' + campo + '"]')
                .val()
        );
    }

    function consolidarModeloContatos() {
        for (var i = 0; i < contatosEdicao.length; i++) {
            if (contatosEdicao[i].removido) {
                continue;
            }

            var chave = String(contatosEdicao[i].indice);
            contatosEdicao[i].nome = valorEditorContato(chave, "nome");
            contatosEdicao[i].cargo = valorEditorContato(chave, "cargo");
            contatosEdicao[i].telefone = valorEditorContato(chave, "telefone");
            contatosEdicao[i].email = valorEditorContato(chave, "email");
            contatosEdicao[i].linkedin = valorEditorContato(chave, "linkedin");
        }
    }

    function criarCampoEditorContato(rotulo, campo, valor, tipo) {
        var grupo = $("<div></div>").addClass("col-md-4 form-group");
        var entrada = $("<input>")
            .attr("type", tipo || "text")
            .attr("data-secondary-field", campo)
            .addClass("form-control")
            .val(valor || "");

        grupo.append($("<label></label>").text(rotulo));
        grupo.append(entrada);
        return grupo;
    }

    function renderizarEditorContatos() {
        var destino = $("#editorContatosSecundarios");
        var ordemVisual = 0;
        destino.empty();

        for (var i = 0; i < contatosEdicao.length; i++) {
            var contato = contatosEdicao[i];
            if (contato.removido) {
                continue;
            }

            ordemVisual++;
            var card = $("<div></div>")
                .addClass("lead-secondary-editor")
                .attr("data-secondary-key", contato.indice);
            var linha1 = $("<div></div>").addClass("row");
            var linha2 = $("<div></div>").addClass("row");

            card.append($("<h3></h3>").text("Contato secundário " + ordemVisual));
            linha1.append(criarCampoEditorContato("Nome", "nome", contato.nome));
            linha1.append(criarCampoEditorContato("Cargo", "cargo", contato.cargo));
            linha1.append(criarCampoEditorContato("Telefone", "telefone", contato.telefone));
            linha2.append(criarCampoEditorContato("E-mail", "email", contato.email, "email"));
            linha2.append(criarCampoEditorContato("LinkedIn", "linkedin", contato.linkedin));
            card.append(linha1).append(linha2);
            card.append(
                $("<div></div>").addClass("lead-secondary-editor-actions").append(
                    $("<button></button>")
                        .attr("type", "button")
                        .attr("data-action", "remover-contato-secundario")
                        .attr("data-secondary-key", contato.indice)
                        .addClass("btn btn-link text-danger")
                        .text("Remover")
                )
            );
            destino.append(card);
        }

        if (ordemVisual === 0) {
            destino.append(
                $("<p></p>")
                    .addClass("lead-secondary-empty")
                    .text("Nenhum contato secundário informado.")
            );
        }
    }

    function mostrarMensagemEdicao(erros) {
        var elemento = $("#mensagemEmpresaContato");
        if (!erros || erros.length === 0) {
            elemento.removeClass("is-visible is-error").empty();
            return;
        }

        elemento.addClass("is-visible is-error").html(erros.join("<br>"));
    }

    function normalizarEmail(valor) {
        return valorLimpo(valor).toLowerCase();
    }

    function normalizarTelefone(valor) {
        return valorLimpo(valor).replace(/\D/g, "");
    }

    function normalizarLinkedin(valor) {
        return valorLimpo(valor)
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/+$/, "");
    }

    function possuiSeparadorReservado(valor) {
        var texto = String(valor || "");
        return texto.indexOf("~~~") >= 0 || texto.indexOf("|||") >= 0;
    }

    function validarContatosEdicao() {
        var erros = [];
        var idReferencia = valorLimpo($("#lead_id_referencia").val());
        var idNumerico = parseInt(idReferencia, 10);
        var vistos = { email: {}, telefone: {}, linkedin: {} };
        var contatos = [{
            rotulo: "Contato principal",
            nome: valorLimpo($("#edit_contato_nome").val()),
            telefone: valorLimpo($("#edit_contato_telefone").val()),
            email: valorLimpo($("#edit_contato_email").val()),
            linkedin: valorLimpo($("#edit_contato_linkedin").val())
        }];

        if (
            idReferencia !== ""
            && (!/^\d+$/.test(idReferencia) || isNaN(idNumerico) || idNumerico <= 0)
        ) {
            erros.push("O identificador SQL do lead não foi informado ou é inválido.");
        }

        consolidarModeloContatos();
        for (var i = 0; i < contatosEdicao.length; i++) {
            if (!contatosEdicao[i].removido) {
                contatos.push({
                    rotulo: "Contato secundário " + (contatos.length),
                    nome: contatosEdicao[i].nome,
                    cargo: contatosEdicao[i].cargo,
                    telefone: contatosEdicao[i].telefone,
                    email: contatosEdicao[i].email,
                    linkedin: contatosEdicao[i].linkedin
                });
            }
        }

        for (var c = 0; c < contatos.length; c++) {
            var contato = contatos[c];
            var valores = [contato.nome, contato.cargo, contato.telefone, contato.email, contato.linkedin];
            if (c > 0 && valores.every(function (valor) { return valorLimpo(valor) === ""; })) {
                erros.push(contato.rotulo + " está vazio; preencha algum dado ou remova a linha.");
                continue;
            }
            for (var v = 0; v < valores.length; v++) {
                if (possuiSeparadorReservado(valores[v])) {
                    erros.push(contato.rotulo + " contém um separador reservado (~~~ ou |||).");
                    break;
                }
            }

            if (contato.email !== "" && !emailSeguro(contato.email)) {
                erros.push("Informe um e-mail válido para " + contato.rotulo.toLowerCase() + ".");
            }
            if (contato.telefone !== "" && !telefoneSeguro(contato.telefone)) {
                erros.push("Informe um telefone válido para " + contato.rotulo.toLowerCase() + ".");
            }
            if (contato.linkedin !== "" && !urlSegura(contato.linkedin)) {
                erros.push("Informe um LinkedIn válido para " + contato.rotulo.toLowerCase() + ".");
            }

            var chaves = {
                email: normalizarEmail(contato.email),
                telefone: normalizarTelefone(contato.telefone),
            linkedin: normalizarLinkedin(contato.linkedin)
            };
            Object.keys(chaves).forEach(function (tipo) {
                var chave = chaves[tipo];
                if (chave !== "" && vistos[tipo][chave]) {
                    erros.push("Há contatos duplicados pelo campo " + tipo + ".");
                } else if (chave !== "") {
                    vistos[tipo][chave] = true;
                }
            });
        }

        return erros;
    }

    function abrirEdicao() {
        if (!podeEditarEmpresaContato()) {
            return;
        }

        preencherEditorPrincipal();
        contatosEdicao = lerContatosParaEdicao();
        edicaoAberta = true;
        mostrarMensagemEdicao([]);
        renderizarEditorContatos();
        $("#editorEmpresaContato").removeClass("lead-hidden");
        $("#painelEmpresaContato .lead-company-contact-layout").addClass("is-editing");
        $("#btnEditarEmpresaContato").addClass("lead-hidden");
    }

    function fecharEdicao() {
        edicaoAberta = false;
        contatosEdicao = [];
        mostrarMensagemEdicao([]);
        $("#editorEmpresaContato").addClass("lead-hidden");
        $("#painelEmpresaContato .lead-company-contact-layout").removeClass("is-editing");
        $("#btnEditarEmpresaContato").toggleClass("lead-hidden", !podeEditarEmpresaContato());
    }

    function adicionarContatoSecundario() {
        consolidarModeloContatos();
        sequenciaTemporaria++;
        contatosEdicao.push({
            indice: "NOVO_" + sequenciaTemporaria,
            novo: true,
            removido: false,
            ordem: String(contatosEdicao.length + 1),
            nome: "", cargo: "", telefone: "", email: "", linkedin: ""
        });
        renderizarEditorContatos();
    }

    function marcarContatoParaRemocao(chave) {
        consolidarModeloContatos();
        var contato = contatoSecundarioPorIndice(chave);
        if (contato) {
            contato.removido = true;
            renderizarEditorContatos();
        }
    }

    function removerLinhaContato(indice) {
        var elemento = $("[name='cont_sec_nome___" + indice + "']");
        if (elemento.length && typeof fnWdkRemoveChild === "function") {
            fnWdkRemoveChild(elemento[0]);
            indicesContatosRemovidos[String(indice)] = true;
            return true;
        }
        return false;
    }

    function contatosSecundariosForamAlterados() {
        var campos = ["ordem", "nome", "cargo", "telefone", "email", "linkedin"];

        for (var i = 0; i < contatosEdicao.length; i++) {
            var contato = contatosEdicao[i];
            if (contato.novo || contato.removido) {
                return true;
            }

            for (var c = 0; c < campos.length; c++) {
                var campo = campos[c];
                if (
                    valorLimpo(contato[campo])
                    !== valorLimpo(obterValorFilho("cont_sec_" + campo, contato.indice))
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function registrarCamposAlterados(campos) {
        var registrados = String($("#ec_campos_alterados").val() || "")
            .split(",")
            .filter(function (campo) { return campo !== ""; });

        for (var i = 0; i < campos.length; i++) {
            if (registrados.indexOf(campos[i]) < 0) {
                registrados.push(campos[i]);
            }
        }

        $("#ec_campos_alterados").val(registrados.join(","));
    }

    function consolidarEdicao() {
        if (!edicaoAberta) {
            return [];
        }

        var erros = validarContatosEdicao();
        if (erros.length) {
            mostrarMensagemEdicao(erros);
            return erros;
        }

        for (var d = 0; d < contatosEdicao.length; d++) {
            if (contatosEdicao[d].novo && !contatosEdicao[d].removido && typeof wdkAddChild !== "function") {
                erros.push("Não foi possível adicionar contatos secundários no formulário.");
            }
            if (!contatosEdicao[d].novo && contatosEdicao[d].removido && typeof fnWdkRemoveChild !== "function") {
                erros.push("Não foi possível remover contatos secundários no formulário.");
            }
        }
        if (erros.length) {
            mostrarMensagemEdicao(erros);
            return erros;
        }

        var campos = [
            "empresa_nome", "empresa_cnpj", "empresa_site",
            "segmento", "cidade",
            "contato_nome", "contato_cargo", "contato_telefone",
            "contato_email", "contato_linkedin"
        ];
        var camposAlterados = [];
        var contatosAlterados = contatosSecundariosForamAlterados();
        for (var i = 0; i < campos.length; i++) {
            var valorAtual = valorLimpo($("#" + campos[i]).val());
            var valorEditado = valorLimpo($("#edit_" + campos[i]).val());
            if (valorAtual !== valorEditado) {
                camposAlterados.push(campos[i]);
            }
            $("#" + campos[i]).val(valorEditado);
        }

        var ordem = 0;
        for (var c = 0; c < contatosEdicao.length; c++) {
            var contato = contatosEdicao[c];
            if (contato.removido) {
                if (!contato.novo && !removerLinhaContato(contato.indice)) {
                    erros.push("Não foi possível remover um contato secundário.");
                }
                continue;
            }

            ordem++;
            var indice = contato.indice;
            if (contato.novo) {
                if (typeof wdkAddChild !== "function") {
                    erros.push("Não foi possível adicionar o contato secundário no formulário.");
                    continue;
                }
                indice = String(wdkAddChild("tbContatosSecundarios"));
            }
            preencherContatoSecundario(indice, {
                ordem: String(ordem),
                nome: contato.nome,
                cargo: contato.cargo,
                telefone: contato.telefone,
                email: contato.email,
                linkedin: contato.linkedin
            });
        }

        if (erros.length) {
            mostrarMensagemEdicao(erros);
            return erros;
        }

        registrarCamposAlterados(camposAlterados);
        if (contatosAlterados) {
            $("#ec_contatos_alterados").val("true");
        }

        if (IRHOLeads.Tentativas && typeof IRHOLeads.Tentativas.atualizarContatos === "function") {
            IRHOLeads.Tentativas.atualizarContatos();
        }
        atualizarApresentacao();
        fecharEdicao();
        return [];
    }

    function prepararParaSalvar() {
        if (edicaoAberta) {
            return consolidarEdicao();
        }

        preencherEditorPrincipal();
        contatosEdicao = lerContatosParaEdicao();
        renderizarEditorContatos();
        var erros = validarContatosEdicao();
        contatosEdicao = [];
        $("#editorContatosSecundarios").empty();
        return erros;
    }

    function podePreencherDadosTeste() {
        return window.IRHOLeads
            && IRHOLeads.Contexto
            && !IRHOLeads.Contexto.somenteLeitura()
            && IRHOLeads.Contexto.ehEtapaInicial();
    }

    function preencherCampo(nomeCampo, valor) {
        $("#" + nomeCampo).val(valor);
    }

    function preencherContatoSecundario(indice, dados) {
        var campos = ["ordem", "nome", "cargo", "telefone", "email", "linkedin"];

        for (var i = 0; i < campos.length; i++) {
            $("[name='cont_sec_" + campos[i] + "___" + indice + "']")
                .val(dados[campos[i]] || "");
        }
    }

    function obterOuCriarIndicesSecundarios(quantidade) {
        var indices = obterIndicesContatosSecundarios();

        while (indices.length < quantidade && typeof wdkAddChild === "function") {
            indices.push(String(wdkAddChild("tbContatosSecundarios")));
        }

        return indices;
    }

    function preencherDadosTeste() {
        var indices;

        if (!podePreencherDadosTeste()) {
            return;
        }

        if (!window.confirm(
            "Preencher o painel com dados fictícios para teste? "
            + "Os dados atuais de empresa e contatos serão substituídos."
        )) {
            return;
        }

        preencherCampo("lead_id", "LEAD-TESTE-001");
        preencherCampo("empresa_nome", "Empresa Exemplo Tecnologia Ltda.");
        preencherCampo("empresa_cnpj", "12.345.678/0001-90");
        preencherCampo("empresa_site", "https://www.empresaexemplo.com.br");
        preencherCampo("tipo_registro", "Pessoa jurídica");
        preencherCampo("crm_origem", "Dados de teste");
        preencherCampo("segmento", "Tecnologia");
        preencherCampo("cidade", "São Paulo/SP");
        preencherCampo("score_percentual", "82");
        preencherCampo("score_classificacao", "ALTO");
        preencherCampo("qual_mais_50", "SIM");
        preencherCampo("qual_decisor", "SIM");
        preencherCampo("qual_filiais", "NÃO");
        preencherCampo("qual_conhece_empresa", "SIM");
        preencherCampo("qual_diagnostico_rh", "NÃO");
        preencherCampo("contato_nome", "Mariana Costa");
        preencherCampo("contato_cargo", "Gerente de Recursos Humanos");
        preencherCampo("contato_telefone", "(11) 99999-1111");
        preencherCampo("contato_email", "mariana.costa@empresaexemplo.com.br");
        preencherCampo("contato_linkedin", "https://www.linkedin.com/in/mariana-costa");

        indices = obterOuCriarIndicesSecundarios(2);

        if (indices.length > 0) {
            preencherContatoSecundario(indices[0], {
                ordem: "1",
                nome: "Rafael Mendes",
                cargo: "Coordenador Administrativo",
                telefone: "(11) 98888-2222",
                email: "rafael.mendes@empresaexemplo.com.br",
                linkedin: "https://www.linkedin.com/in/rafael-mendes"
            });
        }

        if (indices.length > 1) {
            preencherContatoSecundario(indices[1], {
                ordem: "2",
                nome: "Camila Rocha",
                cargo: "Analista de Pessoas",
                telefone: "(11) 97777-3333",
                email: "camila.rocha@empresaexemplo.com.br",
                linkedin: "https://www.linkedin.com/in/camila-rocha"
            });
        }

        if (
            IRHOLeads.Tentativas
            && typeof IRHOLeads.Tentativas.atualizarContatos === "function"
        ) {
            IRHOLeads.Tentativas.atualizarContatos();
        }

        atualizarApresentacao();
    }

    function atualizarTentativasAposTroca(indiceSecundario, nomePrincipal, nomeSecundario) {
        var referenciaSecundaria = "SECUNDARIO___" + indiceSecundario;

        $('#tbTentativasContato [name^="tent_contato_ref___"]').each(function () {
            var referencias = String($(this).val() || "").split("|");
            var alterado = false;

            for (var i = 0; i < referencias.length; i++) {
                if (referencias[i] === "PRINCIPAL") {
                    referencias[i] = referenciaSecundaria;
                    alterado = true;
                } else if (referencias[i] === referenciaSecundaria) {
                    referencias[i] = "PRINCIPAL";
                    alterado = true;
                }
            }

            if (alterado) {
                $(this).val(referencias.join("|"));
            }
        });
    }

    function trocarContatoPrincipal(indiceSecundario) {
        var campos = ["nome", "cargo", "telefone", "email", "linkedin"];
        var valoresPrincipais = {};
        var valoresSecundarios = {};
        var nomePrincipal = valorLimpo(obterValorCampo("contato_nome"));
        var nomeSecundario = valorLimpo(
            obterValorFilho("cont_sec_nome", indiceSecundario)
        );

        if (nomeSecundario === "") {
            return;
        }

        if (!window.confirm(
            "Definir “" + nomeSecundario + "” como contato principal? "
            + "O contato principal atual será mantido como secundário."
        )) {
            return;
        }

        for (var i = 0; i < campos.length; i++) {
            valoresPrincipais[campos[i]] = obterValorCampo("contato_" + campos[i]);
            valoresSecundarios[campos[i]] = obterValorFilho(
                "cont_sec_" + campos[i],
                indiceSecundario
            );
        }

        for (var j = 0; j < campos.length; j++) {
            $("#contato_" + campos[j]).val(valoresSecundarios[campos[j]]);
            $("[name='cont_sec_" + campos[j] + "___" + indiceSecundario + "']")
                .val(valoresPrincipais[campos[j]]);
        }

        registrarCamposAlterados([
            "contato_nome",
            "contato_cargo",
            "contato_telefone",
            "contato_email",
            "contato_linkedin"
        ]);
        $("#ec_contatos_alterados").val("true");

        atualizarTentativasAposTroca(
            indiceSecundario,
            nomePrincipal,
            nomeSecundario
        );

        if (
            IRHOLeads.Tentativas
            && typeof IRHOLeads.Tentativas.atualizarContatos === "function"
        ) {
            IRHOLeads.Tentativas.atualizarContatos();
        }

        atualizarApresentacao();
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

            if (podeTrocarContatoPrincipal()) {
                card.append(
                    $("<button></button>")
                        .attr("type", "button")
                        .attr("data-action", "trocar-contato-principal")
                        .attr("data-secundario-index", indice)
                        .addClass("lead-btn-promote-contact")
                        .text("Tornar principal")
                );
            }

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
            "#fonte_insercao",
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

    function inicializarTrocaContato() {
        $("#painelEmpresaContato")
            .off("click.irhoEmpresaContato", '[data-action="trocar-contato-principal"]')
            .on(
                "click.irhoEmpresaContato",
                '[data-action="trocar-contato-principal"]',
                function (evento) {
                    evento.preventDefault();
                    trocarContatoPrincipal(
                        String($(this).attr("data-secundario-index") || "")
                    );
                }
            );
    }

    function inicializarDadosTeste() {
        $("#btnPreencherDadosTeste")
            .toggleClass("lead-hidden", !podePreencherDadosTeste())
            .off("click.irhoEmpresaContato")
            .on("click.irhoEmpresaContato", preencherDadosTeste);
    }

    function inicializarEdicao() {
        $("#btnEditarEmpresaContato")
            .toggleClass("lead-hidden", !podeEditarEmpresaContato())
            .off("click.irhoEmpresaContato")
            .on("click.irhoEmpresaContato", abrirEdicao);

        $("#btnCancelarEmpresaContato")
            .off("click.irhoEmpresaContato")
            .on("click.irhoEmpresaContato", fecharEdicao);

        $("#btnSalvarEmpresaContato")
            .off("click.irhoEmpresaContato")
            .on("click.irhoEmpresaContato", consolidarEdicao);

        $("#btnAdicionarContatoSecundario")
            .off("click.irhoEmpresaContato")
            .on("click.irhoEmpresaContato", adicionarContatoSecundario);

        $("#editorContatosSecundarios")
            .off("click.irhoEmpresaContato", '[data-action="remover-contato-secundario"]')
            .on(
                "click.irhoEmpresaContato",
                '[data-action="remover-contato-secundario"]',
                function () {
                    marcarContatoParaRemocao(
                        String($(this).attr("data-secondary-key") || "")
                    );
                }
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
        inicializarTrocaContato();
        inicializarDadosTeste();
        inicializarEdicao();
    }

    return {
        inicializar: inicializar,
        prepararParaSalvar: prepararParaSalvar,
        validarEdicao: validarContatosEdicao
    };
}());

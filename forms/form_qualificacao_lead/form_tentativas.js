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

        atualizarContatos();

        atualizarIconeMeioContato(
            IRHOLeads.Dados.campoFilho("tent_meio", indice)
        );

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

    function textoLimpo(valor) {
        return $.trim(String(valor || ""));
    }

    function contatosDisponiveis() {
        var contatos = [];
        var nomePrincipal = textoLimpo($("#contato_nome").val());

        if (nomePrincipal !== "") {
            contatos.push({
                referencia: "PRINCIPAL",
                nome: nomePrincipal,
                rotulo: "Principal — " + nomePrincipal
            });
        }

        $("#tbContatosSecundarios")
            .find('[name^="cont_sec_nome___"]')
            .each(function () {
                var nomeCampo = $(this).attr("name") || "";
                var partes = nomeCampo.split("___");
                var indice = partes.length === 2 ? partes[1] : "";
                var nome = textoLimpo($(this).val());

                if (indice === "" || nome === "") {
                    return;
                }

                contatos.push({
                    referencia: "SECUNDARIO___" + indice,
                    nome: nome,
                    rotulo: "Secundário — " + nome
                });
            });

        return contatos;
    }

    function referenciasContato(valor) {
        if (!valor) {
            return [];
        }

        return String(valor).split("|").filter(function (referencia) {
            return referencia !== "";
        });
    }

    function atualizarContatoSelecionado(campo) {
        var campoReferencia = $(campo);
        var indice = IRHOLeads.Dados.obterIndiceFilho(campoReferencia);
        var nomes = [];
        var campoNome = IRHOLeads.Dados.campoFilho("tent_contato_nome", indice);

        campoReferencia
            .closest(".form-group")
            .find('[data-contact-selector] input:checked')
            .each(function () {
                nomes.push($(this).attr("data-contato-nome") || "");
            });

        if (nomes.length > 0 || textoLimpo(campoReferencia.val()) === "") {
            campoNome.val(nomes.join(" | "));
        }
    }

    function atualizarContatos() {
        var contatos = contatosDisponiveis();

        $('#tbTentativasContato [name^="tent_contato_ref___"]').each(function () {
            var campoReferencia = $(this);
            var referenciasAtuais = referenciasContato(campoReferencia.val());
            var indiceTentativa = IRHOLeads.Dados.obterIndiceFilho(campoReferencia);
            var nomesHistoricos = textoLimpo(
                IRHOLeads.Dados.campoFilho("tent_contato_nome", indiceTentativa).val()
            ).split(" | ");
            var seletor = campoReferencia
                .closest(".form-group")
                .find("[data-contact-selector]");

            seletor.empty();

            if (contatos.length === 0) {
                seletor.append(
                    $("<span></span>")
                        .addClass("lead-attempt-contact-empty")
                        .text("Nenhum contato cadastrado.")
                );
            }

            contatos.forEach(function (contato) {
                var identificador = "tentContato_"
                    + (campoReferencia.attr("name") || "").replace(/[^a-zA-Z0-9]/g, "_")
                    + "_"
                    + contato.referencia.replace(/[^a-zA-Z0-9]/g, "_");
                var marcado = referenciasAtuais.indexOf(contato.referencia) !== -1;
                var opcao = $("<label></label>")
                    .addClass("lead-attempt-contact-choice")
                    .toggleClass("is-selected", marcado)
                    .attr("for", identificador);

                opcao.append(
                    $("<input>")
                        .attr("type", "checkbox")
                        .attr("id", identificador)
                        .attr("data-contato-ref", contato.referencia)
                        .attr("data-contato-nome", contato.nome)
                        .prop("checked", marcado)
                );

                seletor.append(
                    opcao.append(
                        $("<span></span>").text(contato.rotulo)
                    )
                );
            });

            referenciasAtuais.forEach(function (referencia, posicao) {
                var disponivel = contatos.some(function (contato) {
                    return contato.referencia === referencia;
                });
                if (disponivel) {
                    return;
                }

                var nomeHistorico = nomesHistoricos[posicao] || "Contato removido";
                seletor.append(
                    $("<label></label>")
                        .addClass("lead-attempt-contact-choice is-selected is-historical")
                        .append(
                            $("<input>")
                                .attr("type", "checkbox")
                                .attr("data-contato-ref", referencia)
                                .attr("data-contato-nome", nomeHistorico)
                                .prop("checked", true)
                                .prop("disabled", true)
                        )
                        .append($("<span></span>").text("Histórico — " + nomeHistorico))
                );
            });

            atualizarContatoSelecionado(campoReferencia);
        });
    }

    function focarNovaTentativa(indice) {
        setTimeout(function () {
            IRHOLeads.Dados.campoFilho("tent_meio", indice)
                .trigger("focus");
        }, 50);
    }

    function atualizarIconeMeioContato(campo) {
        var meios = {
            EMAIL: {
                icone: "fa-regular fa-envelope",
                classe: "lead-attempt-email"
            },
            LINKEDIN: {
                icone: "fa-brands fa-linkedin",
                classe: "lead-attempt-linkedin"
            },
            WHATSAPP: {
                icone: "fa-brands fa-whatsapp",
                classe: "lead-attempt-whatsapp"
            },
            TELEFONE: {
                icone: "fa-solid fa-phone",
                classe: "lead-attempt-telefone"
            }
        };
        var seletor = $(campo);
        var card = seletor.closest(".lead-attempt-card");
        var icone = card.find(".lead-attempt-channel-icon i");
        var valor = seletor.val() || "";

        card.removeClass(
            "lead-attempt-email lead-attempt-linkedin lead-attempt-whatsapp lead-attempt-telefone"
        );

        icone.removeClass(
            "fa-regular fa-envelope fa-brands fa-linkedin fa-square-linkedin fa-whatsapp fa-solid fa-phone fa-phone-volume"
        );

        if (valor && meios[valor]) {
            icone.addClass(meios[valor].icone);
            card.addClass(meios[valor].classe);
            return;
        }
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
            "change",
            '[name^="tent_meio___"]',
            function () {
                atualizarIconeMeioContato(this);
            }
        );

        $("#tbTentativasContato").on(
            "change",
            '[data-contact-selector] input[type="checkbox"]',
            function () {
                var grupo = $(this).closest(".form-group");
                var referencias = [];
                var campoReferencia = grupo.find('[name^="tent_contato_ref___"]');

                $(this)
                    .closest(".lead-attempt-contact-choice")
                    .toggleClass("is-selected", $(this).is(":checked"));

                grupo.find('[data-contact-selector] input:checked').each(function () {
                    referencias.push($(this).attr("data-contato-ref") || "");
                });

                campoReferencia.val(referencias.join("|"));
                atualizarContatoSelecionado(campoReferencia);
            }
        );

        $('#tbTentativasContato [name^="tent_meio___"]').each(function () {
            atualizarIconeMeioContato(this);
        });

        $("#tbTentativasContato").on(
            "input",
            '[name^="tent_hora___"]',
            function () {
                this.value = mascararHora(this.value);
            }
        );

        atualizarContatos();
        renumerar();
        atualizarEstadoVazio();
    }

    return {
        inicializar: inicializar,
        adicionar: adicionar,
        remover: remover,
        renumerar: renumerar,
        atualizarEstadoVazio: atualizarEstadoVazio,
        atualizarContatos: atualizarContatos
    };
}());

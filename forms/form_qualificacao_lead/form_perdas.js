window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Perdas = (function () {
    "use strict";

    var modalPerda = null;

    var MOTIVOS_PERDA = [
        {
            codigo: "SEM_ORCAMENTO",
            descricao: "Sem orçamento / Verba insuficiente"
        },
        {
            codigo: "PRECO_ACIMA",
            descricao: "Preço acima do esperado"
        },
        {
            codigo: "FORA_ICP",
            descricao: "Lead fora do perfil (ICP)"
        },
        {
            codigo: "CONCORRENTE",
            descricao: "Escolheu o concorrente"
        },
        {
            codigo: "SEM_RETORNO",
            descricao: "Sem retorno do contato (Ghosting)"
        },
        {
            codigo: "TIMING",
            descricao: "Timing inadequado (Adiou projeto)"
        },
        {
            codigo: "SEM_FIT_TECNICO",
            descricao: "Falta de fit técnico (Produto não atende)"
        },
        {
            codigo: "SEM_CONTATO",
            descricao: "Impossibilidade de contato"
        },
        {
            codigo: "COMPRA_CANCELADA",
            descricao: "Compra cancelada internamente"
        },
        {
            codigo: "SEM_PRIORIDADE",
            descricao: "Falta de prioridade no momento"
        },
        {
            codigo: "CONTATO_INVALIDO",
            descricao: "Dados de contato inválidos"
        },
        {
            codigo: "DUPLICIDADE",
            descricao: "Duplicidade de cadastro"
        }
    ];

    function nomeAtividade(codigo) {
        var nomes = {
            4: "Tentativa de Contato",
            19: "Oportunidade Gerada",
            21: "Proposta comercial",
            72: "Atividade Parceiro"
        };

        return nomes[codigo] || "";
    }

    function gerarChave() {
        return "PERDA-"
            + new Date().getTime()
            + "-"
            + Math.floor(Math.random() * 1000000);
    }

    function montarOpcoes() {
        var html = '<option value=""></option>';

        for (var i = 0; i < MOTIVOS_PERDA.length; i++) {
            html += '<option value="'
                + MOTIVOS_PERDA[i].codigo
                + '">'
                + MOTIVOS_PERDA[i].descricao
                + "</option>";
        }

        return html;
    }

    function montarConteudoModal() {
        return '<div class="lead-loss-modal">'
            + '<div class="form-group">'
            + '<label for="motivoPerdaModal" class="label-obrigatorio">'
            + "Justificativa"
            + "</label>"
            + '<select id="motivoPerdaModal" class="form-control">'
            + montarOpcoes()
            + "</select>"
            + "</div>"
            + '<div id="mensagemMotivoPerda" '
            + 'class="lead-loss-modal-feedback" role="alert"></div>'
            + "</div>";
    }

    function abrirModal() {
        if (
            IRHOLeads.Contexto.somenteLeitura()
            || !IRHOLeads.Contexto.ehAtividadeComercial()
        ) {
            return;
        }

        if (!window.FLUIGC || !FLUIGC.modal) {
            mostrarFalha(
                "Não foi possível carregar o modal do Fluig."
            );
            return;
        }

        modalPerda = FLUIGC.modal(
            {
                title: "Registrar Lead Perdido",
                content: montarConteudoModal(),
                id: "modalRegistrarLeadPerdido",
                size: "small",
                actions: [
                    {
                        label: "Cancelar",
                        autoClose: true
                    },
                    {
                        label: "Confirmar e enviar",
                        bind: "data-confirmar-perda",
                        autoClose: false,
                        classType: "btn-danger"
                    }
                ]
            }
        );

        $('[data-confirmar-perda]')
            .off("click.irhoPerdas")
            .on("click.irhoPerdas", confirmar);
    }

    function confirmar() {
        var codigoMotivo = $("#motivoPerdaModal").val() || "";
        var motivo = localizarMotivo(codigoMotivo);
        var atividadeAtual = IRHOLeads.Contexto.atividadeAtual();
        var atividadeNome = nomeAtividade(atividadeAtual);
        var funilOrigem = obterFunilOrigem();

        if (!motivo) {
            $("#mensagemMotivoPerda")
                .addClass("is-visible")
                .text("Selecione uma justificativa para registrar a perda.");
            return;
        }

        if (!atividadeNome) {
            $("#mensagemMotivoPerda")
                .addClass("is-visible")
                .text("A atividade atual não permite registrar Lead Perdido.");
            return;
        }

        if (funilOrigem === "") {
            $("#mensagemMotivoPerda")
                .addClass("is-visible")
                .text("O funil original do lead não foi informado.");
            return;
        }

        $("#acao_fluxo_comercial").val("LEAD_PERDIDO");
        $("#funil_origem_perda").val(funilOrigem);
        $("#atividade_origem_perda").val(String(atividadeAtual));
        $("#atividade_origem_nome").val(atividadeNome);
        $("#motivo_perda_codigo").val(motivo.codigo);
        $("#motivo_perda_texto").val(motivo.descricao);
        $("#perda_chave_pendente").val(gerarChave());

        if (modalPerda && typeof modalPerda.remove === "function") {
            modalPerda.remove();
        }

        modalPerda = null;
        IRHOLeads.Salvamento.movimentarLeadPerdido();
    }

    function obterFunilOrigem() {
        return IRHOLeads.Contexto.funilDestino();
    }

    function localizarMotivo(codigo) {
        for (var i = 0; i < MOTIVOS_PERDA.length; i++) {
            if (MOTIVOS_PERDA[i].codigo === codigo) {
                return MOTIVOS_PERDA[i];
            }
        }

        return null;
    }

    function indicesHistorico() {
        var indices = [];

        $('[name^="perda_id___"]').each(function () {
            var nome = $(this).attr("name") || "";
            var partes = nome.split("___");

            if (partes.length === 2 && indices.indexOf(partes[1]) === -1) {
                indices.push(partes[1]);
            }
        });

        return indices;
    }

    function atualizarHistorico() {
        var indices = indicesHistorico();

        $("#perdasEstadoVazio")
            .toggleClass("lead-hidden", indices.length > 0);

        for (var i = 0; i < indices.length; i++) {
            atualizarCard(indices[i]);
        }
    }

    function atualizarCard(indice) {
        var linha = $('[name="perda_id___' + indice + '"]').closest("tr");
        var ordem = $('[name="perda_ordem___' + indice + '"]').val() || "";
        var dataHora = $('[name="perda_data_hora___' + indice + '"]').val() || "";

        linha.find('[data-loss-field="perda_ordem"]').text(ordem);
        linha.find('[data-loss-field="perda_data_hora"]').text(dataHora);
    }

    function possuiHistorico() {
        return indicesHistorico().length > 0;
    }

    function mostrarFalha(mensagem) {
        if (window.FLUIGC && FLUIGC.toast) {
            FLUIGC.toast({
                title: "Lead Perdido",
                message: mensagem,
                type: "danger"
            });
            return;
        }

        window.alert(mensagem);
    }

    function inicializar() {
        $("#btnLeadPerdido")
            .off("click.irhoPerdas")
            .on("click.irhoPerdas", abrirModal);

        atualizarHistorico();
    }

    return {
        inicializar: inicializar,
        abrirModal: abrirModal,
        atualizarHistorico: atualizarHistorico,
        possuiHistorico: possuiHistorico
    };
}());

var EF_ATIVIDADE_INICIO = 6;
var EF_ATIVIDADE_TENTATIVA_CONTATO = 4;
var EF_ATIVIDADE_LEAD_PERDIDO = 26;
var EF_ATIVIDADE_NUTRICAO = 87;
var EF_TABELA_TENTATIVAS = "tbTentativasContato";
var EF_TABELA_HISTORICO_PERDAS = "tbHistoricoPerdas";
var EF_TABELA_CONTATOS_SECUNDARIOS = "tbContatosSecundarios";

function enableFields(form) {
    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );

    bloquearCamposIntegracao(form, atividadeAtual);
    configurarFunil(form, atividadeAtual);
    configurarRecuperacao(form, atividadeAtual);
    bloquearHistoricoPerdas(form);
    bloquearContatosSecundarios(form, atividadeAtual);

    if (atividadeAtual !== EF_ATIVIDADE_TENTATIVA_CONTATO) {
        bloquearHistoricoTentativas(form);
        bloquearClassificacao(form);
    }
}

function configurarRecuperacao(form, atividadeAtual) {
    form.setEnabled(
        "atividade_recuperacao",
        atividadeAtual === EF_ATIVIDADE_LEAD_PERDIDO
            || atividadeAtual === EF_ATIVIDADE_NUTRICAO,
        true
    );
}

function configurarFunil(form, atividadeAtual) {
    form.setEnabled(
        "funil_destino",
        atividadeAtual === 0
            || atividadeAtual === EF_ATIVIDADE_INICIO,
        true
    );
}

function bloquearClassificacao(form) {
    var campos = [
        "class_interesse",
        "class_necessidades",
        "class_orcamento",
        "class_timeline",
        "class_autoridade",
        "class_comunicacao"
    ];

    for (var i = 0; i < campos.length; i++) {
        form.setEnabled(
            campos[i],
            false,
            true
        );
    }
}

function bloquearCamposIntegracao(form, atividadeAtual) {
    var possuiTentativasRegistradas =
        atividadeAtual === EF_ATIVIDADE_TENTATIVA_CONTATO
        && form.getChildrenIndexes(EF_TABELA_TENTATIVAS).length > 0;
    var camposIntegracao = [
        "empresa_nome",
        "empresa_cnpj",
        "crm_origem",
        "contato_nome",
        "contato_cargo",
        "contato_email",
        "contato_telefone",
        "contato_linkedin",
        "lead_id",
        "fonte_insercao",
        "empresa_site",
        "tipo_registro",
        "segmento",
        "cidade",
        "score_percentual",
        "score_classificacao",
        "qual_mais_50",
        "qual_decisor",
        "qual_filiais",
        "qual_conhece_empresa",
        "qual_diagnostico_rh"
    ];
    var camposEditaveisTentativa = [
        "empresa_nome",
        "empresa_cnpj",
        "empresa_site",
        "segmento",
        "cidade",
        "contato_nome",
        "contato_cargo",
        "contato_email",
        "contato_telefone",
        "contato_linkedin"
    ];

    form.setEnabled("lead_id_referencia", false, true);

    for (var i = 0; i < camposIntegracao.length; i++) {
        var permitirDadosTeste = atividadeAtual === 0
            || atividadeAtual === EF_ATIVIDADE_INICIO;
        var campoAtual = camposIntegracao[i];
        var editavelNaTentativa = camposEditaveisTentativa.indexOf(campoAtual) >= 0;

        form.setEnabled(
            campoAtual,
            campoAtual !== "lead_id"
                && campoAtual !== "fonte_insercao"
                && campoAtual !== "tipo_registro"
                && (permitirDadosTeste
                || (
                    editavelNaTentativa
                    && atividadeAtual === EF_ATIVIDADE_TENTATIVA_CONTATO
                    && !possuiTentativasRegistradas
                )),
            true
        );
    }
}

function bloquearContatosSecundarios(form, atividadeAtual) {
    var indices = form.getChildrenIndexes(
        EF_TABELA_CONTATOS_SECUNDARIOS
    );
    var possuiTentativasRegistradas =
        atividadeAtual === EF_ATIVIDADE_TENTATIVA_CONTATO
        && form.getChildrenIndexes(EF_TABELA_TENTATIVAS).length > 0;
    var camposFilhos = [
        "cont_sec_ordem",
        "cont_sec_nome",
        "cont_sec_cargo",
        "cont_sec_telefone",
        "cont_sec_email",
        "cont_sec_linkedin"
    ];

    for (var i = 0; i < indices.length; i++) {
        var indice = indices[i];

        for (var j = 0; j < camposFilhos.length; j++) {
            form.setEnabled(
                camposFilhos[j] + "___" + indice,
                    atividadeAtual === 0
                    || atividadeAtual === EF_ATIVIDADE_INICIO
                    || (
                        atividadeAtual === EF_ATIVIDADE_TENTATIVA_CONTATO
                        && !possuiTentativasRegistradas
                    ),
                true
            );
        }
    }
}

function bloquearHistoricoTentativas(form) {
    var indices = form.getChildrenIndexes(
        EF_TABELA_TENTATIVAS
    );

    var camposFilhos = [
        "tent_id",
        "tent_ordem",
        "tent_numero",
        "tent_contato_ref",
        "tent_contato_nome",
        "tent_meio",
        "tent_data",
        "tent_hora",
        "tent_descricao"
    ];

    for (var i = 0; i < indices.length; i++) {
        var indice = indices[i];

        for (var j = 0; j < camposFilhos.length; j++) {
            form.setEnabled(
                camposFilhos[j] + "___" + indice,
                false,
                true
            );
        }
    }
}

function bloquearHistoricoPerdas(form) {
    var indices = form.getChildrenIndexes(
        EF_TABELA_HISTORICO_PERDAS
    );

    var camposFilhos = [
        "perda_id",
        "perda_ordem",
        "perda_data_hora",
        "perda_atividade_codigo",
        "perda_atividade_nome",
        "perda_funil",
        "perda_motivo_codigo",
        "perda_motivo_texto"
    ];

    for (var i = 0; i < indices.length; i++) {
        var indice = indices[i];

        for (var j = 0; j < camposFilhos.length; j++) {
            form.setEnabled(
                camposFilhos[j] + "___" + indice,
                false,
                true
            );
        }
    }
}

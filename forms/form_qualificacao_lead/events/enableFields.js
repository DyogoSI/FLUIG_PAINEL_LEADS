var EF_ATIVIDADE_INICIO = 6;
var EF_ATIVIDADE_TENTATIVA_CONTATO = 4;
var EF_ATIVIDADE_LEAD_PERDIDO = 26;
var EF_TABELA_TENTATIVAS = "tbTentativasContato";
var EF_TABELA_HISTORICO_PERDAS = "tbHistoricoPerdas";
var EF_TABELA_CONTATOS_SECUNDARIOS = "tbContatosSecundarios";

function enableFields(form) {
    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );

    bloquearCamposIntegracao(form);
    configurarFunil(form, atividadeAtual);
    configurarRecuperacao(form, atividadeAtual);
    bloquearHistoricoPerdas(form);
    bloquearContatosSecundarios(form);

    if (atividadeAtual !== EF_ATIVIDADE_TENTATIVA_CONTATO) {
        bloquearHistoricoTentativas(form);
        bloquearClassificacao(form);
    }
}

function configurarRecuperacao(form, atividadeAtual) {
    form.setEnabled(
        "atividade_recuperacao",
        atividadeAtual === EF_ATIVIDADE_LEAD_PERDIDO,
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

function bloquearCamposIntegracao(form) {
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

    for (var i = 0; i < camposIntegracao.length; i++) {
        form.setEnabled(
            camposIntegracao[i],
            false,
            true
        );
    }
}

function bloquearContatosSecundarios(form) {
    var indices = form.getChildrenIndexes(
        EF_TABELA_CONTATOS_SECUNDARIOS
    );
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
                false,
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

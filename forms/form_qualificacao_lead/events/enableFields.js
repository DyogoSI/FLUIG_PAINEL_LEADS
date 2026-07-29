var EF_ATIVIDADE_TENTATIVA_CONTATO = 4;
var EF_TABELA_TENTATIVAS = "tbTentativasContato";

function enableFields(form) {
    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );

    bloquearCamposIntegracao(form);

    if (atividadeAtual !== EF_ATIVIDADE_TENTATIVA_CONTATO) {
        bloquearHistoricoTentativas(form);
        bloquearClassificacao(form);
    }
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
        "contato_linkedin"
    ];

    for (var i = 0; i < camposIntegracao.length; i++) {
        form.setEnabled(
            camposIntegracao[i],
            false,
            true
        );
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
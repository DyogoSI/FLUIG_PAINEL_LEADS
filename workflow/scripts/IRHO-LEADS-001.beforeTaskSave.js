var BTS_ATIVIDADE_INICIO = 6;
var BTS_ATIVIDADE_TENTATIVA_CONTATO = 4;
var BTS_ATIVIDADE_OPORTUNIDADE_GERADA = 19;
var BTS_ATIVIDADE_PROPOSTA_COMERCIAL = 21;
var BTS_TABELA_HISTORICO_PERDAS = "tbHistoricoPerdas";

function beforeTaskSave(
    colleagueId,
    nextSequenceId,
    userList
) {
    var numSolicitacao = getValue("WKNumProces");
    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );
    var completandoAtividade = btsTarefaEstaSendoConcluida();
    var acaoFluxo = btsTexto(
        hAPI.getCardValue("acao_fluxo_comercial")
    );
    var prefixoLog = ">>> [IRHO-LEADS] beforeTaskSave";

    log.info(
        prefixoLog
        + " | Solicitação: "
        + numSolicitacao
        + " | Atividade atual: "
        + atividadeAtual
        + " | Destino: "
        + nextSequenceId
        + " | Completando: "
        + completandoAtividade
        + " | Ação comercial: "
        + acaoFluxo
    );

    if (
        atividadeAtual == 0
        || atividadeAtual == BTS_ATIVIDADE_INICIO
    ) {
        if (completandoAtividade) {
            hAPI.setCardValue("acao_atividade", "MOVIMENTAR");
            hAPI.setCardValue(
                "acao_fluxo_comercial",
                "AVANCAR"
            );
        }

        return;
    }

    if (!btsEhAtividadeComercial(atividadeAtual)) {
        return;
    }

    if (!completandoAtividade) {
        hAPI.setCardValue("acao_atividade", "SALVAR");
        hAPI.setCardValue("acao_fluxo_comercial", "");
        return;
    }

    hAPI.setCardValue("acao_atividade", "MOVIMENTAR");

    if (acaoFluxo == "LEAD_PERDIDO") {
        btsRegistrarHistoricoPerda(atividadeAtual);
        hAPI.setCardValue("atividade_recuperacao", "");
        return;
    }

    hAPI.setCardValue(
        "acao_fluxo_comercial",
        "AVANCAR"
    );
}

function btsRegistrarHistoricoPerda(atividadeAtual) {
    var chavePendente = btsTexto(
        hAPI.getCardValue("perda_chave_pendente")
    );

    if (chavePendente == "") {
        throw "A chave de controle da perda não foi informada.";
    }

    var resumo = btsResumoHistorico(chavePendente);

    if (resumo.jaExiste) {
        log.info(
            ">>> [IRHO-LEADS] Histórico de perda já registrado"
            + " | Chave: "
            + chavePendente
        );
        return;
    }

    var filho = new java.util.HashMap();
    var formato = new java.text.SimpleDateFormat(
        "dd/MM/yyyy HH:mm"
    );

    filho.put("perda_id", chavePendente);
    filho.put("perda_ordem", String(resumo.maiorOrdem + 1));
    filho.put(
        "perda_data_hora",
        formato.format(new java.util.Date())
    );
    filho.put(
        "perda_atividade_codigo",
        String(atividadeAtual)
    );
    filho.put(
        "perda_atividade_nome",
        btsTexto(hAPI.getCardValue("atividade_origem_nome"))
    );
    filho.put(
        "perda_funil",
        btsTexto(hAPI.getCardValue("funil_origem_perda"))
    );
    filho.put(
        "perda_motivo_codigo",
        btsTexto(hAPI.getCardValue("motivo_perda_codigo"))
    );
    filho.put(
        "perda_motivo_texto",
        btsTexto(hAPI.getCardValue("motivo_perda_texto"))
    );

    hAPI.addCardChild(
        BTS_TABELA_HISTORICO_PERDAS,
        filho
    );
}

function btsResumoHistorico(chavePendente) {
    var indices = hAPI.getChildrenIndexes(
        BTS_TABELA_HISTORICO_PERDAS
    );
    var resultado = {
        jaExiste: false,
        maiorOrdem: 0
    };

    if (indices == null) {
        return resultado;
    }

    for (var i = 0; i < indices.length; i++) {
        var indice = String(indices[i]);
        var perdaId = btsTexto(
            hAPI.getCardValue("perda_id___" + indice)
        );
        var ordem = parseInt(
            hAPI.getCardValue("perda_ordem___" + indice),
            10
        );

        if (perdaId == chavePendente) {
            resultado.jaExiste = true;
        }

        if (!isNaN(ordem) && ordem > resultado.maiorOrdem) {
            resultado.maiorOrdem = ordem;
        }
    }

    return resultado;
}

function btsEhAtividadeComercial(atividadeAtual) {
    return atividadeAtual == BTS_ATIVIDADE_TENTATIVA_CONTATO
        || atividadeAtual == BTS_ATIVIDADE_OPORTUNIDADE_GERADA
        || atividadeAtual == BTS_ATIVIDADE_PROPOSTA_COMERCIAL;
}

function btsTarefaEstaSendoConcluida() {
    var valor = getValue("WKCompletTask");

    return valor === true
        || String(valor).toLowerCase() == "true";
}

function btsTexto(valor) {
    if (valor == null) {
        return "";
    }

    return String(valor).replace(/^\s+|\s+$/g, "");
}

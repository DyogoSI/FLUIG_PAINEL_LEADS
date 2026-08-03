var BTS_ATIVIDADE_INICIO = 6;
var BTS_ATIVIDADE_TENTATIVA_CONTATO = 4;
var BTS_ATIVIDADE_OPORTUNIDADE_GERADA = 19;
var BTS_ATIVIDADE_PROPOSTA_COMERCIAL = 21;
var BTS_ATIVIDADE_LEAD_PERDIDO = 26;
var BTS_ATIVIDADE_PARCEIRO = 72;
var BTS_ATIVIDADE_NUTRICAO = 87;
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

    if (atividadeAtual == BTS_ATIVIDADE_TENTATIVA_CONTATO) {
        btsSincronizarEmpresaContatos();
    }

    if (
        atividadeAtual == 0
        || atividadeAtual == BTS_ATIVIDADE_INICIO
    ) {
        if (completandoAtividade) {
            hAPI.setCardValue(
                "funil_origem_fluxo",
                btsTexto(hAPI.getCardValue("funil_destino"))
            );
            hAPI.setCardValue("acao_atividade", "MOVIMENTAR");
            hAPI.setCardValue(
                "acao_fluxo_comercial",
                "AVANCAR"
            );
        }

        return;
    }

    if (
        atividadeAtual == BTS_ATIVIDADE_LEAD_PERDIDO
        || atividadeAtual == BTS_ATIVIDADE_NUTRICAO
    ) {
        hAPI.setCardValue(
            "acao_atividade",
            completandoAtividade ? "MOVIMENTAR" : "SALVAR"
        );
        hAPI.setCardValue("acao_fluxo_comercial", "");
        return;
    }

    if (!btsEhAtividadeComercial(atividadeAtual)) {
        return;
    }

    if (
        btsTexto(hAPI.getCardValue("funil_origem_fluxo"))
        == ""
    ) {
        hAPI.setCardValue(
            "funil_origem_fluxo",
            btsTexto(hAPI.getCardValue("funil_destino"))
        );
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

    if (acaoFluxo == "NUTRICAO") {
        hAPI.setCardValue("atividade_recuperacao", "");
        return;
    }

    if (acaoFluxo != "" && acaoFluxo != "AVANCAR") {
        throw "A ação comercial informada é inválida.";
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
        || atividadeAtual == BTS_ATIVIDADE_PROPOSTA_COMERCIAL
        || atividadeAtual == BTS_ATIVIDADE_PARCEIRO;
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

function btsSincronizarEmpresaContatos() {
    var idReferencia = btsTexto(
        hAPI.getCardValue("lead_id_referencia")
    );
    var idNumerico = parseInt(idReferencia, 10);

    if (!/^\d+$/.test(idReferencia) || isNaN(idNumerico) || idNumerico <= 0) {
        throw "Não foi possível sincronizar os dados do lead com o painel: identificador SQL inválido.";
    }

    var loteContatos = btsMontarLoteContatos();
    var valores = {
        operacao: "sincronizar_processo",
        id: String(idNumerico),
        lead_id: btsTexto(hAPI.getCardValue("lead_id")),
        lead_nome: btsTexto(hAPI.getCardValue("contato_nome")),
        lead_cargo: btsTexto(hAPI.getCardValue("contato_cargo")),
        lead_telefone: btsTexto(hAPI.getCardValue("contato_telefone")),
        lead_email: btsTexto(hAPI.getCardValue("contato_email")),
        lead_linkedin: btsTexto(hAPI.getCardValue("contato_linkedin")),
        empresa_nome: btsTexto(hAPI.getCardValue("empresa_nome")),
        empresa_cnpj: btsTexto(hAPI.getCardValue("empresa_cnpj")),
        empresa_site: btsTexto(hAPI.getCardValue("empresa_site")),
        lead_origem: btsTexto(hAPI.getCardValue("crm_origem")),
        tipo_registro: btsTexto(hAPI.getCardValue("tipo_registro")),
        segmento: btsTexto(hAPI.getCardValue("segmento")),
        cidade: btsTexto(hAPI.getCardValue("cidade")),
        substituirContatos: "true",
        loteContatos: loteContatos
    };
    var constraints = [];
    var campos = [
        "operacao", "id", "lead_id", "lead_nome", "lead_cargo",
        "lead_telefone", "lead_email", "lead_linkedin", "empresa_nome",
        "empresa_cnpj", "empresa_site", "lead_origem", "tipo_registro",
        "segmento", "cidade", "substituirContatos", "loteContatos"
    ];

    for (var i = 0; i < campos.length; i++) {
        constraints.push(
            DatasetFactory.createConstraint(
                campos[i],
                valores[campos[i]],
                valores[campos[i]],
                ConstraintType.MUST
            )
        );
    }

    var retorno = DatasetFactory.getDataset(
        "ds_painel_leads_gravar",
        null,
        constraints,
        null
    );

    if (retorno == null || retorno.rowsCount <= 0) {
        throw "Não foi possível sincronizar os dados do lead com o painel: dataset sem retorno.";
    }

    var resultado = btsTexto(retorno.getValue(0, "resultado"));
    var mensagem = btsTexto(retorno.getValue(0, "mensagem"));
    if (resultado != "ok") {
        throw "Não foi possível sincronizar os dados do lead com o painel: "
            + (mensagem == "" ? "falha não detalhada." : mensagem);
    }
}

function btsMontarLoteContatos() {
    var indices = hAPI.getChildrenIndexes("tbContatosSecundarios");
    var contatos = [];

    if (indices == null) {
        return "";
    }

    for (var i = 0; i < indices.length; i++) {
        var indice = String(indices[i]);
        var ordem = parseInt(
            hAPI.getCardValue("cont_sec_ordem___" + indice),
            10
        );
        if (isNaN(ordem)) {
            ordem = parseInt(indice, 10);
        }
        if (isNaN(ordem)) {
            ordem = i + 1;
        }

        var campos = [
            btsTexto(hAPI.getCardValue("cont_sec_nome___" + indice)),
            btsTexto(hAPI.getCardValue("cont_sec_cargo___" + indice)),
            btsTexto(hAPI.getCardValue("cont_sec_telefone___" + indice)),
            btsTexto(hAPI.getCardValue("cont_sec_email___" + indice)),
            btsTexto(hAPI.getCardValue("cont_sec_linkedin___" + indice))
        ];

        for (var c = 0; c < campos.length; c++) {
            if (campos[c].indexOf("~~~") >= 0 || campos[c].indexOf("|||") >= 0) {
                throw "Não foi possível sincronizar os dados do lead com o painel: contato secundário contém separador reservado.";
            }
        }

        contatos.push({
            ordem: ordem,
            indice: indice,
            campos: campos
        });
    }

    contatos.sort(function (a, b) {
        if (a.ordem != b.ordem) {
            return a.ordem - b.ordem;
        }
        return parseInt(a.indice, 10) - parseInt(b.indice, 10);
    });

    var linhas = [];
    for (var j = 0; j < contatos.length; j++) {
        linhas.push(contatos[j].campos.join("|||"));
    }

    return linhas.join("~~~");
}

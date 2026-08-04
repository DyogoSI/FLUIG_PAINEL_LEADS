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

    if (idReferencia == "") {
        hAPI.setCardValue("ec_campos_alterados", "");
        hAPI.setCardValue("ec_contatos_alterados", "");
        return;
    }

    if (!/^\d+$/.test(idReferencia) || isNaN(idNumerico) || idNumerico <= 0) {
        throw "Não foi possível sincronizar os dados do lead com o painel: identificador SQL inválido.";
    }

    var camposAlterados = btsObterCamposEmpresaContatoAlterados();
    var contatosAlterados = btsTexto(
        hAPI.getCardValue("ec_contatos_alterados")
    ).toLowerCase() == "true";

    if (camposAlterados.lista.length == 0 && !contatosAlterados) {
        return;
    }

    var dadosAtuais = btsCarregarDadosAtuaisPainel(idNumerico);
    var valores = {
        operacao: "sincronizar_processo",
        id: String(idNumerico),
        lead_id: btsTexto(hAPI.getCardValue("lead_id")),
        lead_nome: btsValorSincronizacao(camposAlterados, "contato_nome", "lead_nome", dadosAtuais),
        lead_cargo: btsValorSincronizacao(camposAlterados, "contato_cargo", "lead_cargo", dadosAtuais),
        lead_telefone: btsValorSincronizacao(camposAlterados, "contato_telefone", "lead_telefone", dadosAtuais),
        lead_email: btsValorSincronizacao(camposAlterados, "contato_email", "lead_email", dadosAtuais),
        lead_linkedin: btsValorSincronizacao(camposAlterados, "contato_linkedin", "lead_linkedin", dadosAtuais),
        empresa_nome: btsValorSincronizacao(camposAlterados, "empresa_nome", "empresa_nome", dadosAtuais),
        empresa_cnpj: btsValorSincronizacao(camposAlterados, "empresa_cnpj", "empresa_cnpj", dadosAtuais),
        empresa_site: btsValorSincronizacao(camposAlterados, "empresa_site", "empresa_site", dadosAtuais),
        substituirContatos: contatosAlterados ? "true" : "false"
    };
    var constraints = [];
    var campos = [
        "operacao", "id", "lead_id", "lead_nome", "lead_cargo",
        "lead_telefone", "lead_email", "lead_linkedin", "empresa_nome",
        "empresa_cnpj", "empresa_site", "substituirContatos"
    ];

    if (camposAlterados.mapa["segmento"]) {
        valores.segmento = btsTexto(hAPI.getCardValue("segmento"));
        campos.push("segmento");
    }
    if (camposAlterados.mapa["cidade"]) {
        valores.cidade = btsTexto(hAPI.getCardValue("cidade"));
        campos.push("cidade");
    }
    if (contatosAlterados) {
        valores.loteContatos = btsMontarLoteContatos();
        campos.push("loteContatos");
    }

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

    hAPI.setCardValue("ec_campos_alterados", "");
    hAPI.setCardValue("ec_contatos_alterados", "");
}

function btsObterCamposEmpresaContatoAlterados() {
    var permitidos = {
        empresa_nome: true,
        empresa_cnpj: true,
        empresa_site: true,
        segmento: true,
        cidade: true,
        contato_nome: true,
        contato_cargo: true,
        contato_telefone: true,
        contato_email: true,
        contato_linkedin: true
    };
    var partes = btsTexto(
        hAPI.getCardValue("ec_campos_alterados")
    ).split(",");
    var lista = [];
    var mapa = {};

    for (var i = 0; i < partes.length; i++) {
        var campo = btsTexto(partes[i]);
        if (permitidos[campo] && !mapa[campo]) {
            mapa[campo] = true;
            lista.push(campo);
        }
    }

    return { lista: lista, mapa: mapa };
}

function btsCarregarDadosAtuaisPainel(idNumerico) {
    var constraints = [
        DatasetFactory.createConstraint(
            "id",
            String(idNumerico),
            String(idNumerico),
            ConstraintType.MUST
        )
    ];
    var retorno = DatasetFactory.getDataset(
        "ds_painel_leads_sql",
        null,
        constraints,
        null
    );

    if (retorno == null || retorno.rowsCount != 1) {
        throw "Não foi possível sincronizar os dados do lead com o painel: registro atual não localizado.";
    }

    var campos = [
        "lead_nome", "lead_cargo", "lead_telefone", "lead_email", "lead_linkedin",
        "empresa_nome", "empresa_cnpj", "empresa_site"
    ];
    var dados = {};
    for (var i = 0; i < campos.length; i++) {
        dados[campos[i]] = btsTexto(retorno.getValue(0, campos[i]));
    }
    return dados;
}

function btsValorSincronizacao(camposAlterados, campoFormulario, campoBanco, dadosAtuais) {
    if (camposAlterados.mapa[campoFormulario]) {
        return btsTexto(hAPI.getCardValue(campoFormulario));
    }
    return btsTexto(dadosAtuais[campoBanco]);
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

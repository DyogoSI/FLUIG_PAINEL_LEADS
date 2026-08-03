function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("resultado");
    dataset.addColumn("id");
    dataset.addColumn("mensagem");

    var valores = dplgMontarValores(constraints);
    if (String(valores["operacao"] || "") === "sincronizar_processo") {
        return dplgSincronizarProcesso(dataset, valores);
    }

    return dplgExecutarModoLegado(dataset, valores);
}

function dplgMontarValores(constraints) {
    var valores = {};
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            valores[String(constraints[i].getFieldName())] = constraints[i].getInitialValue();
        }
    }
    return valores;
}

function dplgExecutarModoLegado(dataset, valores) {
    var camposTexto = ["lead_id", "lead_nome", "lead_cargo", "lead_telefone", "lead_email", "lead_linkedin",
        "empresa_nome", "empresa_cnpj", "empresa_site", "lead_origem", "lead_status", "fonte_insercao", "dados_extras"];
    var conn = null;
    var pstmt = null;
    var stmtId = null;
    var rsId = null;

    try {
        var idInformado = valores["id"];
        var isUpdate = idInformado != null && String(idInformado).trim() !== "" && parseInt(idInformado, 10) > 0;

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        if (isUpdate) {
            var setClause = "";
            for (var i = 0; i < camposTexto.length; i++) {
                setClause += (i > 0 ? ", " : "") + camposTexto[i] + " = ?";
            }
            var sqlUpdate = "UPDATE PAINEL_LEADS_DADOS SET " + setClause + ", data_atualizacao = GETDATE() WHERE id = ?";

            pstmt = conn.prepareStatement(sqlUpdate);
            for (var i = 0; i < camposTexto.length; i++) {
                pstmt.setString(i + 1, String(valores[camposTexto[i]] || ""));
            }
            pstmt.setInt(camposTexto.length + 1, parseInt(idInformado, 10));
            pstmt.executeUpdate();

            dataset.addRow(["ok", String(idInformado), ""]);
        } else {
            var colunas = "";
            var placeholders = "";
            for (var i = 0; i < camposTexto.length; i++) {
                colunas += (i > 0 ? ", " : "") + camposTexto[i];
                placeholders += (i > 0 ? ", " : "") + "?";
            }
            var sqlInsert = "INSERT INTO PAINEL_LEADS_DADOS (" + colunas + ") VALUES (" + placeholders + ")";

            pstmt = conn.prepareStatement(sqlInsert);
            for (var i = 0; i < camposTexto.length; i++) {
                pstmt.setString(i + 1, String(valores[camposTexto[i]] || ""));
            }
            pstmt.executeUpdate();

            stmtId = conn.createStatement();
            rsId = stmtId.executeQuery("SELECT SCOPE_IDENTITY() AS novoId");
            var novoId = "";
            if (rsId.next()) { novoId = rsId.getString("novoId"); }

            dataset.addRow(["ok", novoId, ""]);
        }
    } catch (e) {
        dataset.addRow(["erro", "", e.toString()]);
    } finally {
        if (rsId != null) { try { rsId.close(); } catch(e) {} }
        if (stmtId != null) { try { stmtId.close(); } catch(e) {} }
        if (pstmt != null) { try { pstmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function dplgSincronizarProcesso(dataset, valores) {
    var idTexto = dplgTexto(valores["id"]);
    var id = parseInt(idTexto, 10);
    var conn = null;
    var pstmtSelect = null;
    var rs = null;
    var pstmtUpdate = null;
    var pstmtContatos = null;
    var pstmtDelete = null;
    var pstmtInsert = null;

    if (!/^\d+$/.test(idTexto) || isNaN(id) || id <= 0) {
        dataset.addRow(["erro", "", "ID do lead inválido."]);
        return dataset;
    }

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();
        conn.setAutoCommit(false);

        pstmtSelect = conn.prepareStatement(
            "SELECT lead_id, lead_nome, lead_cargo, lead_telefone, lead_email, lead_linkedin, "
            + "empresa_nome, empresa_cnpj, empresa_site, lead_origem, dados_extras "
            + "FROM PAINEL_LEADS_DADOS WITH (UPDLOCK, ROWLOCK) WHERE id = ?"
        );
        pstmtSelect.setInt(1, id);
        rs = pstmtSelect.executeQuery();
        if (!rs.next()) {
            throw "Nenhum lead encontrado para o ID informado.";
        }

        var leadIdAtual = dplgTexto(rs.getString("lead_id"));
        var leadIdRecebido = dplgTexto(valores["lead_id"]);
        if (leadIdRecebido !== "" && leadIdAtual !== "" && leadIdRecebido !== leadIdAtual) {
            throw "O código comercial do lead não corresponde ao registro informado.";
        }

        var camposEditaveis = [
            "lead_nome", "lead_cargo", "lead_telefone", "lead_email", "lead_linkedin",
            "empresa_nome", "empresa_cnpj", "empresa_site", "lead_origem"
        ];
        var alteracoes = [];
        var parametros = [];

        for (var i = 0; i < camposEditaveis.length; i++) {
            var campo = camposEditaveis[i];
            var atual = dplgTexto(rs.getString(campo));
            var recebido = dplgTexto(valores[campo]);

            if (campo === "lead_origem" && recebido === "") {
                recebido = atual;
            }
            if (atual !== recebido) {
                alteracoes.push(campo + " = ?");
                parametros.push(recebido);
            }
        }

        var dadosExtrasAtual = rs.getString("dados_extras");
        var dadosExtrasNovo = dplgAtualizarDadosExtras(dadosExtrasAtual, valores);
        if (String(dadosExtrasAtual || "") !== dadosExtrasNovo) {
            alteracoes.push("dados_extras = ?");
            parametros.push(dadosExtrasNovo);
        }
        rs.close();
        rs = null;
        pstmtSelect.close();
        pstmtSelect = null;

        var principalAlterado = alteracoes.length > 0;
        if (principalAlterado) {
            var sqlUpdate = "UPDATE PAINEL_LEADS_DADOS SET "
                + alteracoes.join(", ")
                + ", data_atualizacao = GETDATE() WHERE id = ?";
            pstmtUpdate = conn.prepareStatement(sqlUpdate);
            for (var p = 0; p < parametros.length; p++) {
                pstmtUpdate.setString(p + 1, parametros[p]);
            }
            pstmtUpdate.setInt(parametros.length + 1, id);
            var afetados = pstmtUpdate.executeUpdate();
            if (afetados !== 1) {
                throw "O UPDATE do lead afetou " + afetados + " linha(s).";
            }
        }

        var substituirContatos = String(valores["substituirContatos"] || "").toLowerCase() === "true";
        var contatosAlterados = false;
        if (substituirContatos) {
            var contatosRecebidos = dplgInterpretarLoteContatos(valores["loteContatos"]);
            var contatosAtuais = [];
            pstmtContatos = conn.prepareStatement(
                "SELECT nome, cargo, telefone, email, linkedin "
                + "FROM PAINEL_LEADS_CONTATOS_SECUNDARIOS WITH (UPDLOCK, ROWLOCK) "
                + "WHERE id_lead_principal = ?"
            );
            pstmtContatos.setInt(1, id);
            var rsContatos = pstmtContatos.executeQuery();
            while (rsContatos.next()) {
                contatosAtuais.push([
                    dplgTexto(rsContatos.getString("nome")),
                    dplgTexto(rsContatos.getString("cargo")),
                    dplgTexto(rsContatos.getString("telefone")),
                    dplgTexto(rsContatos.getString("email")),
                    dplgTexto(rsContatos.getString("linkedin"))
                ]);
            }
            rsContatos.close();
            pstmtContatos.close();
            pstmtContatos = null;

            contatosAlterados = !dplgContatosIguais(contatosAtuais, contatosRecebidos);
            if (contatosAlterados) {
                pstmtDelete = conn.prepareStatement(
                    "DELETE FROM PAINEL_LEADS_CONTATOS_SECUNDARIOS WHERE id_lead_principal = ?"
                );
                pstmtDelete.setInt(1, id);
                pstmtDelete.executeUpdate();

                if (contatosRecebidos.length > 0) {
                    pstmtInsert = conn.prepareStatement(
                        "INSERT INTO PAINEL_LEADS_CONTATOS_SECUNDARIOS "
                        + "(id_lead_principal, nome, cargo, telefone, email, linkedin) "
                        + "VALUES (?, ?, ?, ?, ?, ?)"
                    );
                    for (var c = 0; c < contatosRecebidos.length; c++) {
                        pstmtInsert.setInt(1, id);
                        for (var f = 0; f < 5; f++) {
                            pstmtInsert.setString(f + 2, contatosRecebidos[c][f]);
                        }
                        pstmtInsert.addBatch();
                    }
                    var resultadosBatch = pstmtInsert.executeBatch();
                    if (resultadosBatch.length !== contatosRecebidos.length) {
                        throw "A quantidade de contatos inseridos não corresponde ao lote recebido.";
                    }
                    for (var b = 0; b < resultadosBatch.length; b++) {
                        if (resultadosBatch[b] === java.sql.Statement.EXECUTE_FAILED) {
                            throw "Falha ao inserir um contato secundário.";
                        }
                    }
                }
            }
        }

        conn.commit();
        dataset.addRow([
            "ok",
            String(id),
            principalAlterado || contatosAlterados ? "" : "nenhuma alteração"
        ]);
    } catch (e) {
        if (conn != null) {
            try { conn.rollback(); } catch (eRollback) {}
        }
        dataset.addRow(["erro", "", dplgTexto(e)]);
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (pstmtSelect != null) { try { pstmtSelect.close(); } catch(e) {} }
        if (pstmtUpdate != null) { try { pstmtUpdate.close(); } catch(e) {} }
        if (pstmtContatos != null) { try { pstmtContatos.close(); } catch(e) {} }
        if (pstmtDelete != null) { try { pstmtDelete.close(); } catch(e) {} }
        if (pstmtInsert != null) { try { pstmtInsert.close(); } catch(e) {} }
        if (conn != null) {
            try { conn.setAutoCommit(true); } catch(e) {}
            try { conn.close(); } catch(e) {}
        }
    }

    return dataset;
}

function dplgAtualizarDadosExtras(conteudoAtual, valores) {
    var original = String(conteudoAtual || "");
    var extras = {};

    if (original !== "") {
        try {
            extras = JSON.parse(original);
        } catch (e) {
            var recebeuAlteracao = dplgTexto(valores["tipo_registro"]) !== ""
                || dplgTexto(valores["segmento"]) !== ""
                || dplgTexto(valores["cidade"]) !== "";
            if (recebeuAlteracao) {
                throw "O campo dados_extras contém JSON inválido e não pode ser atualizado com segurança.";
            }
            return original;
        }
    }

    var camposExtras = ["tipo_registro", "segmento", "cidade"];
    var possuiValorRecebido = false;
    for (var i = 0; i < camposExtras.length; i++) {
        var campo = camposExtras[i];
        var recebido = dplgTexto(valores[campo]);
        if (recebido !== "") {
            possuiValorRecebido = true;
            extras[campo] = recebido;
        }
    }
    if (!possuiValorRecebido) {
        return original;
    }
    return JSON.stringify(extras);
}

function dplgInterpretarLoteContatos(lote) {
    var texto = String(lote == null ? "" : lote);
    var contatos = [];
    if (texto === "") {
        return contatos;
    }

    var linhas = texto.split("~~~");
    for (var i = 0; i < linhas.length; i++) {
        var campos = linhas[i].split("|||");
        if (campos.length !== 5) {
            throw "O contato secundário " + (i + 1) + " não possui os cinco campos esperados.";
        }
        for (var c = 0; c < campos.length; c++) {
            campos[c] = dplgTexto(campos[c]);
        }
        contatos.push(campos);
    }
    return contatos;
}

function dplgContatosIguais(atuais, recebidos) {
    if (atuais.length !== recebidos.length) {
        return false;
    }

    var listaAtual = [];
    var listaRecebida = [];
    for (var i = 0; i < atuais.length; i++) {
        listaAtual.push(atuais[i].join("\u001f"));
        listaRecebida.push(recebidos[i].join("\u001f"));
    }
    listaAtual.sort();
    listaRecebida.sort();
    return listaAtual.join("\u001e") === listaRecebida.join("\u001e");
}

function dplgTexto(valor) {
    if (valor == null) {
        return "";
    }
    return String(valor).replace(/^\s+|\s+$/g, "");
}

function onMobileSync(user) {}

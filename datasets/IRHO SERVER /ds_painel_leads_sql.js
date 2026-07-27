function defineStructure() {}
function onSync(lastSyncDate) {}

var MAPA_COLUNAS_ORDENAVEIS = {
    "idContato": "lead_id",
    "nomeContato": "lead_nome",
    "email": "lead_email",
    "telefone": "lead_telefone",
    "nomeEmpresa": "empresa_nome",
    "cnpj": "empresa_cnpj",
    "site": "empresa_site"
};

var COLUNAS_BUSCA_TODOS = ["lead_id", "lead_nome", "lead_cargo", "lead_telefone", "lead_email", "lead_linkedin",
    "empresa_nome", "empresa_cnpj", "empresa_site", "lead_origem", "lead_status", "fonte_insercao", "dados_extras"];

function montarValoresConstraints(constraints) {
    var valores = {};
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            var chave = String(constraints[i].getFieldName());
            var valorBruto = constraints[i].getInitialValue();
            // getInitialValue() devolve um objeto Java (String) que não bate com "===" contra
            // literais JS mesmo com o mesmo texto — força a virar string JS de verdade aqui,
            // uma única vez, pra todo o resto do script poder comparar com "===" sem risco.
            valores[chave] = (valorBruto == null) ? "" : String(valorBruto);
        }
    }
    return valores;
}

function montarWhere(valores, whereSql, params) {
    whereSql.push("(lead_status IS NULL OR lead_status NOT LIKE 'Exclu%')");

    var idExato = parseInt(valores["id"], 10);
    if (!isNaN(idExato) && idExato > 0) {
        whereSql.push("id = ?");
        params.push(String(idExato));
        return;
    }

    var status = valores["status"];
    if (status && status !== "todos") {
        if (status === "novo") {
            whereSql.push("LOWER(lead_status) LIKE '%novo%'");
        } else if (status === "contato") {
            whereSql.push("(LOWER(lead_status) LIKE '%contat%' OR LOWER(lead_status) LIKE '%atendimento%')");
        } else if (status === "convertido") {
            whereSql.push("LOWER(lead_status) NOT LIKE '%novo%' AND LOWER(lead_status) NOT LIKE '%contat%' AND LOWER(lead_status) NOT LIKE '%atendimento%'");
        }
    }

    var tipoRegistro = valores["tipoRegistro"];
    if (tipoRegistro === "parceiro") {
        whereSql.push("dados_extras LIKE '%\"tipo_registro\":\"Parceiro\"%'");
    } else if (tipoRegistro === "cliente") {
        whereSql.push("(dados_extras IS NULL OR dados_extras NOT LIKE '%\"tipo_registro\":\"Parceiro\"%')");
    }

    var metodo = valores["metodo"];
    if (metodo && metodo !== "todos") {
        if (metodo === "manual") {
            whereSql.push("fonte_insercao = ?"); params.push("Manualmente");
        } else if (metodo === "diagnostico") {
            whereSql.push("fonte_insercao LIKE ?"); params.push("Diagn%");
        } else if (metodo.indexOf("arquivo::") === 0) {
            whereSql.push("fonte_insercao = ?"); params.push(metodo.substring("arquivo::".length));
        }
    }

    var termo = valores["termo"];
    var coluna = valores["coluna"] || "todos";
    if (termo != null && String(termo).trim() !== "") {
        var termoLimpo = String(termo).trim();
        if (coluna === "idContato") {
            whereSql.push("lead_id = ?");
            params.push(termoLimpo.replace(/\D/g, ""));
        } else if (coluna !== "todos" && MAPA_COLUNAS_ORDENAVEIS[coluna]) {
            whereSql.push(MAPA_COLUNAS_ORDENAVEIS[coluna] + " LIKE ?");
            params.push("%" + termoLimpo + "%");
        } else {
            var partesOr = [];
            for (var i = 0; i < COLUNAS_BUSCA_TODOS.length; i++) {
                partesOr.push(COLUNAS_BUSCA_TODOS[i] + " LIKE ?");
                params.push("%" + termoLimpo + "%");
            }
            whereSql.push("(" + partesOr.join(" OR ") + ")");
        }
    }
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("documentid");
    dataset.addColumn("lead_id");
    dataset.addColumn("lead_nome");
    dataset.addColumn("lead_cargo");
    dataset.addColumn("lead_telefone");
    dataset.addColumn("lead_email");
    dataset.addColumn("lead_linkedin");
    dataset.addColumn("empresa_nome");
    dataset.addColumn("empresa_cnpj");
    dataset.addColumn("empresa_site");
    dataset.addColumn("lead_origem");
    dataset.addColumn("lead_status");
    dataset.addColumn("fonte_insercao");
    dataset.addColumn("dados_extras");

    var conn = null;
    var pstmt = null;
    var rs = null;

    try {
        var valores = montarValoresConstraints(constraints);

        var whereSql = [];
        var params = [];
        montarWhere(valores, whereSql, params);

        var campoOrdenacao = valores["ordenarPor"];
        var colunaOrdenacao = MAPA_COLUNAS_ORDENAVEIS[campoOrdenacao] || "id";
        var orderBySql = (campoOrdenacao === "idContato") ? "TRY_CAST(lead_id AS INT)" : colunaOrdenacao;
        var direcaoOrdenacao = String(valores["ordenarDirecao"]).toUpperCase() === "ASC" ? "ASC" : "DESC";

        // "Exibir: Todos" (itensPorPagina <= 0) não vira busca sem limite de verdade — isso traria
        // a tabela inteira de uma vez com 100 mil linhas. Trava num teto alto (5000) que cobre
        // qualquer visão filtrada razoável sem arriscar carregar tudo de uma vez.
        var LIMITE_MAXIMO_SEM_PAGINACAO = 5000;
        var pagina = parseInt(valores["pagina"], 10) || 1;
        var itensPorPaginaInformado = parseInt(valores["itensPorPagina"], 10);
        var semPaginacaoExplicita = !itensPorPaginaInformado || itensPorPaginaInformado <= 0;
        var itensPorPagina = semPaginacaoExplicita ? LIMITE_MAXIMO_SEM_PAGINACAO : itensPorPaginaInformado;
        var offset = semPaginacaoExplicita ? 0 : (pagina - 1) * itensPorPagina;

        var query = "SELECT id, lead_id, lead_nome, lead_cargo, lead_telefone, lead_email, lead_linkedin, " +
                    "empresa_nome, empresa_cnpj, empresa_site, lead_origem, lead_status, fonte_insercao, dados_extras " +
                    "FROM PAINEL_LEADS_DADOS WHERE " + whereSql.join(" AND ") +
                    " ORDER BY " + orderBySql + " " + direcaoOrdenacao +
                    " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        pstmt = conn.prepareStatement(query);
        var idx = 1;
        for (var i = 0; i < params.length; i++) { pstmt.setString(idx++, params[i]); }
        pstmt.setInt(idx++, offset);
        pstmt.setInt(idx++, itensPorPagina);

        rs = pstmt.executeQuery();
        while (rs.next()) {
            dataset.addRow([
                rs.getString("id") || "",
                rs.getString("lead_id") || "",
                rs.getString("lead_nome") || "",
                rs.getString("lead_cargo") || "",
                rs.getString("lead_telefone") || "",
                rs.getString("lead_email") || "",
                rs.getString("lead_linkedin") || "",
                rs.getString("empresa_nome") || "",
                rs.getString("empresa_cnpj") || "",
                rs.getString("empresa_site") || "",
                rs.getString("lead_origem") || "Site",
                rs.getString("lead_status") || "Novo",
                rs.getString("fonte_insercao") || "Manualmente",
                rs.getString("dados_extras") || ""
            ]);
        }
    } catch (e) {
        dataset.addRow(["ERRO SQL", e.toString(), "", "", "", "", "", "", "", "", "", "", "", ""]);
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (pstmt != null) { try { pstmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

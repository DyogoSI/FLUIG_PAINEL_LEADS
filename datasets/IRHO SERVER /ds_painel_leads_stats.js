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
    dataset.addColumn("total");
    dataset.addColumn("novos");
    dataset.addColumn("contato");
    dataset.addColumn("convertido");
    dataset.addColumn("site");
    dataset.addColumn("redes");
    dataset.addColumn("manual");
    dataset.addColumn("arquivo");
    dataset.addColumn("diagnostico");

    var conn = null;
    var pstmt = null;
    var rs = null;

    try {
        var valores = montarValoresConstraints(constraints);
        var whereSql = [];
        var params = [];
        montarWhere(valores, whereSql, params);

        var query = "SELECT " +
            "COUNT(*) AS total, " +
            "SUM(CASE WHEN LOWER(lead_status) LIKE '%novo%' THEN 1 ELSE 0 END) AS novos, " +
            "SUM(CASE WHEN LOWER(lead_status) NOT LIKE '%novo%' AND (LOWER(lead_status) LIKE '%contat%' OR LOWER(lead_status) LIKE '%atendimento%') THEN 1 ELSE 0 END) AS contato, " +
            "SUM(CASE WHEN LOWER(lead_status) NOT LIKE '%novo%' AND LOWER(lead_status) NOT LIKE '%contat%' AND LOWER(lead_status) NOT LIKE '%atendimento%' THEN 1 ELSE 0 END) AS convertido, " +
            "SUM(CASE WHEN LOWER(lead_origem) LIKE '%site%' THEN 1 ELSE 0 END) AS site, " +
            "SUM(CASE WHEN LOWER(lead_origem) NOT LIKE '%site%' THEN 1 ELSE 0 END) AS redes, " +
            "SUM(CASE WHEN fonte_insercao = 'Manualmente' THEN 1 ELSE 0 END) AS manual, " +
            "SUM(CASE WHEN fonte_insercao LIKE 'Diagn%' THEN 1 ELSE 0 END) AS diagnostico, " +
            "SUM(CASE WHEN fonte_insercao <> 'Manualmente' AND fonte_insercao NOT LIKE 'Diagn%' THEN 1 ELSE 0 END) AS arquivo " +
            "FROM PAINEL_LEADS_DADOS WHERE " + whereSql.join(" AND ");

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        pstmt = conn.prepareStatement(query);
        for (var i = 0; i < params.length; i++) { pstmt.setString(i + 1, params[i]); }

        rs = pstmt.executeQuery();
        if (rs.next()) {
            dataset.addRow([
                rs.getString("total") || "0",
                rs.getString("novos") || "0",
                rs.getString("contato") || "0",
                rs.getString("convertido") || "0",
                rs.getString("site") || "0",
                rs.getString("redes") || "0",
                rs.getString("manual") || "0",
                rs.getString("arquivo") || "0",
                rs.getString("diagnostico") || "0"
            ]);
        }
    } catch (e) {
        dataset.addRow(["0", "0", "0", "0", "0", "0", "0", "0", "0"]);
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (pstmt != null) { try { pstmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

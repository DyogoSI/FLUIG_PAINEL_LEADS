function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("resultado");
    dataset.addColumn("total");
    dataset.addColumn("mensagem");

    var camposTexto = ["lead_id", "lead_nome", "lead_cargo", "lead_telefone", "lead_email", "lead_linkedin",
        "empresa_nome", "empresa_cnpj", "empresa_site", "lead_origem", "lead_status", "fonte_insercao", "dados_extras"];

    var SEPARADOR_LEAD = "~~~";
    var SEPARADOR_CAMPO = "|||";

    var conn = null;
    var pstmt = null;

    try {
        var loteBruto = "";
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                if (String(constraints[i].getFieldName()) === "lote") { loteBruto = constraints[i].getInitialValue(); }
            }
        }

        if (!loteBruto) {
            dataset.addRow(["erro", "0", "lote vazio"]);
            return dataset;
        }

        var linhas = String(loteBruto).split(SEPARADOR_LEAD);

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        var colunas = "";
        var placeholders = "";
        for (var i = 0; i < camposTexto.length; i++) {
            colunas += (i > 0 ? ", " : "") + camposTexto[i];
            placeholders += (i > 0 ? ", " : "") + "?";
        }
        var sqlInsert = "INSERT INTO PAINEL_LEADS_DADOS (" + colunas + ") VALUES (" + placeholders + ")";
        pstmt = conn.prepareStatement(sqlInsert);

        var totalPreparado = 0;
        for (var l = 0; l < linhas.length; l++) {
            if (linhas[l] === "") continue;
            var valoresLinha = linhas[l].split(SEPARADOR_CAMPO);
            for (var c = 0; c < camposTexto.length; c++) {
                pstmt.setString(c + 1, valoresLinha[c] || "");
            }
            pstmt.addBatch();
            totalPreparado++;
        }

        if (totalPreparado > 0) {
            pstmt.executeBatch();
        }

        dataset.addRow(["ok", String(totalPreparado), ""]);
    } catch (e) {
        dataset.addRow(["erro", "0", e.toString()]);
    } finally {
        if (pstmt != null) { try { pstmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

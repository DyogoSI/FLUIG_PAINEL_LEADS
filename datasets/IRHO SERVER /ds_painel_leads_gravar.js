function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("resultado");
    dataset.addColumn("id");
    dataset.addColumn("mensagem");

    var camposTexto = ["lead_id", "lead_nome", "lead_cargo", "lead_telefone", "lead_email", "lead_linkedin",
        "empresa_nome", "empresa_cnpj", "empresa_site", "lead_origem", "lead_status", "fonte_insercao", "dados_extras"];

    var conn = null;
    var pstmt = null;
    var stmtId = null;
    var rsId = null;

    try {
        var valores = {};
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                valores[constraints[i].getFieldName()] = constraints[i].getInitialValue();
            }
        }

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

function onMobileSync(user) {}
